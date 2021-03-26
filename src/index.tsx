/**Dialogue-based Game "The Night"

    Author: Vladislav Maraev
    Modifications by: Bérénice Le Glouanec
    Date of modification: 03/2021
    Course: LT2216 NML 50 DAG

    This typescript index file is modificated as part of a university project.
**/

//Imports
import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Machine, assign, send, State } from "xstate";
import { useMachine, asEffect } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import { dmMachine } from "./dmTheNight";
inspect({ url: "https://statecharts.io/inspect", iframe: false });
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import Confetti from 'react-dom-confetti';
import MouseParticles from 'react-mouse-particles';

//Main Machine
const machine = Machine<SDSContext, any, SDSEvent>(
    {
        id: 'root',
        type: 'parallel',
        states: {
            dm: { ...dmMachine },
            asrtts: {
                initial: 'idle',
                states: {
                    idle: {
                        on: {
                            LISTEN: 'recognising',
                            SPEAK: {
                                target: 'speaking',
                                actions: assign((_context, event) => { return { ttsAgenda: event.value } })
                            }
                        }
                    },
                    recognising: {
                        initial: 'progress',
                        entry: 'recStart',
                        exit: 'recStop',
                        on: {
                            ASRRESULT: {
                                actions: ['recLogResult',
                                    assign((_context, event) => { return { recResult: event.value } })],
                                target: '.match'
                            },
                            RECOGNISED: 'idle',
                        },
                        states: {
                            progress: {},                          
                            match: { entry: send('RECOGNISED'), },
                        }
                    },
                    speaking: {
                        entry: 'ttsStart',
                        on: { ENDSPEECH: 'idle', }
                    }
                }
            }
        },
    },
    {
        actions: {
            recLogResult: (context: SDSContext) => {
                /* context.recResult = event.recResult; */
                console.log('<< ASR: ' + context.recResult);
            },
            test: () => {
                console.log('test')
            },
            logIntent: (context: SDSContext) => {
                /* context.nluData = event.data */
                console.log('<< NLU intent: ' + context.nluData.intent.name)
            }
        },
    }
);


interface Props extends React.HTMLAttributes<HTMLElement> { state: State<SDSContext, any, any, any>; }
const ReactiveButton = (props: Props): JSX.Element => {
    switch (true) {
        //Button when listening
        case props.state.matches({ asrtts: 'recognising' }):
            return (
                <button type="button" className="glow-on-hover"
                    style={{ animation: "glowing 20s linear" }} {...props}>
                    Time to answer...
                </button>
            );
        //Button when speaking
        case props.state.matches({ asrtts: 'speaking' }):
            return (
                <button type="button" className="glow-on-hover"
                    style={{ animation: "bordering 1s infinite" }} {...props}>
                    Listen carefully...
                </button>
            );
        default:
            return (
                <button type="button" className="glow-on-hover" {...props}>
                    The Night
                </button >
            );
    }
}

function App() {
    //Text to speech
    const { speak, cancel, speaking } = useSpeechSynthesis({
        onEnd: () => {
            send('ENDSPEECH');
        },
    });
    //Speech to text
    const { listen, listening, stop } = useSpeechRecognition({
        onResult: (result: any) => {
            send({ type: "ASRRESULT", value: result });
        },
    });
    const [current, send, service] = useMachine(machine, {
        devTools: true,
        actions: {
            recStart: asEffect(() => {
                console.log('Listening...');
                listen({
                    interimResults: false,
                    continuous: true
                });
            }),
            recStop: asEffect(() => {
                console.log('Recognition stopped.');
                stop()
            }),
            ttsStart: asEffect((context, effect) => {
                console.log('Speaking...');
                speak({ text: context.ttsAgenda })
            }),
            ttsCancel: asEffect((context, effect) => {
                console.log('TTS STOP...');
                cancel()
            })
            /* speak: asEffect((context) => {
             * console.log('Speaking...');
             *     speak({text: context.ttsAgenda })
             * } */
        }
    });

    const { confettiEverywhere } = current.context;
    const config = {
        top: "50%",
        left: "50%",
        position: "fixed",
        angle: 90,
        spread: 360,
        startVelocity: 50,
        elementCount: 70,
        dragFriction: 0.12,
        duration: 3000,
        stagger: 3,
        width: "10px",
        height: "10px",
        perspective: "500px",
        colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
    };

    return (
        <div className="App">
            <div className="container">
                <div className="item"/>
                <Confetti active = { confettiEverywhere } config = { config }/>
                <ReactiveButton state={current} onClick={() => send('CLICK')}/>
                <MouseParticles g={1} color="random" cull="col,image-wrapper"/>
            </div>
        </div>
    )
};

/* RASA API
 *  */
const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://nlu-heroku.herokuapp.com/model/parse/';
export const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: 'POST',
        //headers: { 'Origin': 'http://maraev.me' }, // only required with proxy
        headers: { 'Origin': 'http://localhost:3000/' },
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());

const rootElement = document.getElementById("root");
ReactDOM.render(
    <App />,
    rootElement);