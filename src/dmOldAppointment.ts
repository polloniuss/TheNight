import { MachineConfig, send, Action, assign } from "xstate";

import { inspect } from '@xstate/inspect';
inspect({
  url: "https://statecharts.io/inspect",
  iframe: false
});

import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/quotesGrammar.ts'

/*
const gram = loadGrammar(grammar)
const input = "to do is to be"
const prs = parse(input.split(/\s+/), gram)
const result = prs.resultsForRule(gram.$root)[0]
console.log(result)
*/

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

import { nluRequest } from "./index.tsx";

const dict: { [index: string]: { person?: string, day?: string, time?: string, agree?: string, refuse?: string, appointment?: string, todoitem?: string, timer?: string } } = {
    "John": { person: "John Appleseed" },
    "Mary": { person: "Mary Orangeseed" },
    "Dan": { person: "Dan Cherryseed" },
    "Steve": { person: "Steve Strawberryseed" },
    "Klaus": { person: "Klaus Pearseed" },
    "Gus": { person: "Gus Bananaseed" },
    "Jennifer": { person: "Jennifer Pineappleseed" },
    "Monday": { day: "Monday" },
    "Tuesday": { day: "Tuesday" },
    "Wednesday": { day: "Wednesday" },
    "Thursday": { day: "Thursday" },
    "Friday": { day: "Friday" },
    "Saturday": { day: "Saturday" },
    "Sunday": { day: "Sunday" },
    "next Monday": { day: "Monday" },
    "next Tuesday": { day: "Tuesday" },
    "next Wednesday": { day: "Wednesday" },
    "next Thursday": { day: "Thursday" },
    "next Friday": { day: "Friday" },
    "next Saturday": { day: "Saturday" },
    "next Sunday": { day: "Sunday" },
    "on Monday": { day: "Monday" },
    "on Tuesday": { day: "Tuesday" },
    "on Wednesday": { day: "Wednesday" },
    "on Thursday": { day: "Thursday" },
    "on Friday": { day: "Friday" },
    "on Saturday": { day: "Saturday" },
    "on Sunday": { day: "Sunday" },
    "it's at 8": { time: "08:00" },
    "it's at 9": { time: "09:00" },
    "it's at 10": { time: "10:00" },
    "it's at 11": { time: "11:00" },
    "it's at 12": { time: "12:00" },
    "it's at 1": { time: "13:00" },
    "it's at 2": { time: "14:00" },
    "it's at 3": { time: "15:00" },
    "it's at 4": { time: "16:00" },
    "it's at 5": { time: "17:00" },
    "it's at 6": { time: "18:00" },
    "at 8": { time: "08:00" },
    "at 9": { time: "09:00" },
    "at 10": { time: "10:00" },
    "at 11": { time: "11:00" },
    "at 12": { time: "12:00" },
    "at 1": { time: "13:00" },
    "at 2": { time: "14:00" },
    "at 3": { time: "15:00" },
    "at 4": { time: "16:00" },
    "at 5": { time: "17:00" },
    "at 6": { time: "18:00" },
    "8": { time: "08:00" },
    "9": { time: "09:00" },
    "10": { time: "10:00" },
    "11": { time: "11:00" },
    "12": { time: "12:00" },
    "1": { time: "13:00" },
    "2": { time: "14:00" },
    "3": { time: "15:00" },
    "4": { time: "16:00" },
    "5": { time: "17:00" },
    "6": { time: "18:00" },
    "around 8": { time: "08:00" },
    "around 9": { time: "09:00" },
    "around 10": { time: "10:00" },
    "around 11": { time: "11:00" },
    "around 12": { time: "12:00" },
    "around 1": { time: "13:00" },
    "around 2": { time: "14:00" },
    "around 3": { time: "15:00" },
    "around 4": { time: "16:00" },
    "around 5": { time: "17:00" },
    "around 6": { time: "18:00" },
    "I want to book an appointment": { appointment: "appointment" },
    "rendez-vous": { appointment: "appointment" },
    "appointment": { appointment: "appointment" },
    "Let's create an appointment": { appointment: "appointment" },
    "I want an appointment": { appointment: "appointment" },
    "appointment": { appointment: "appointment" },
    "schedule": { appointment: "appointment" },
    "to-do list": { todoitem: "todoitem" },
    "a to-do list": { todoitem: "todoitem" },
    "list": { todoitem: "todoitem" },
    "Let's start a to-do list": { todoitem: "todoitem" },
    "I have something to do": { todoitem: "todoitem" },
    "to do list": { todoitem: "todoitem" },
    "timer": { timer: "timer" },
    "a timer": { timer: "timer" },
    "start the timer": { timer: "timer" },
    "ring": { timer: "timer" },
    "minute": { timer: "timer" },
    "yes": { agree: "yes" },
    "yeah": { agree: "yes" },
    "sounds good": { agree: "yes" },
    "of course": { agree: "yes" },
    "probably": { agree: "yes" },
    "it's fine": { agree: "yes" },
    "no": { refuse: "no" },
    "I'm not sure": { refuse: "no" },
    "I don't think so": { refuse: "no" },
    "no way": { refuse: "no" },
    "absolutely not": { refuse: "no" },
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },
        welcome: {
            initial: "prompt",
            on: { RECOGNISED: 
                { target: 'query' }
            },
            states: {
                prompt: {
                    entry: say("What would you like to do?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                }
            }
        },
        query: {
            invoke: {
                id: 'rasa',
                src: (context, event) => nluRequest(context.recResult),
                onDone: {
                    actions: assign((context, event) => { return { nluData: event.data }}),
                    target: 'rasaChoice'
                },
                onError: {
                    actions: assign({ errorMessage: (context, event) => console.log(event.data)}),
                    target: 'failure',
                }
            }
        },
        failure: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: { entry: say("There is an error. Please check your proxy, your browser or retry later.") }
            }
        },
        rasaChoice: {
            initial: "prompt",
            on: { ENDSPEECH: [{ 
                cond: (context) =>  context.nluData.intent.name === 'appointment',
                target: "appointment"
                },
                { cond: (context) =>  context.nluData.intent.name === 'TODO_item',
                    target: "todo"
                },
                { cond: (context) =>  context.nluData.intent.name === 'timer',
                    target: "timer"
                },
                { target: "welcome" }]
            },
            states: {
                prompt: {
                    entry: say("Actualization.")
                }
            }
        },
        /*choice: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    //cond: (context) => "appointment" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { appointment: dict[ context.recResult].appointment } }),
                    target: "appointment"
                },
                {
                    //cond: (context) => "todoitem" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { todoitem: dict[ context.recResult].todoitem } }),
                    target: "todo"
                },
                {
                    //cond: (context) => "timer" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { timer: dict[ context.recResult].timer } }),
                    target: "timer"
                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("What would you like to do?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Please, choose between appointment, to do list and timer."),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },*/
        appointment: {
            initial: "prompt",
            on: { ENDSPEECH: "who" },
            states: {
                prompt: { entry: say("Let's create an appointment!") }
            }
        },
        todo: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: { entry: say("Let's create a to-do list!") }
            }
        },
        timer: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: { entry: say("Let's start a timer!") }
            }
        },
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "person" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { person: dict[context.recResult].person } }),
                    target: "day"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("Who are you meeting with?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't know them."),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        day: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "day" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { day: dict[context.recResult].day } }),
                    target: "duration"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: 'On which day is your meeting?',
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, can you repeat?"),
                    on: { ENDSPEECH: "prompt" }
                },
            }
        },
        duration: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "agree" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { agree: dict[context.recResult].agree } }),
                    target: "confirmationWholeDay"
                },
                {   
                    cond: (context) => "refuse" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { refuse: dict[context.recResult].refuse } }),
                    target: "time"
                },
                { target: ".nomatch" }],
            },
            states: {
                prompt: {
                    entry: say("Will it take the whole day?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry, can you answer with yes or no?"),
                    on: { ENDSPEECH: "prompt" }
                },
            }
        },
        time: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "time" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { time: dict[context.recResult].time } }),
                    target: "regularConfirmation"
                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("What time is your meeting?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry can you choose between 8 to 12 or 1 to 6?"),
                    on: { ENDSPEECH: "prompt" }
                },
            }
        },
        regularConfirmation: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "agree" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { agree: dict[context.recResult].agree } }),
                    target: "confirmation"
                },
                {   
                    cond: (context) => "refuse" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { refuse: dict[context.recResult].refuse } }),
                    target: "who"
                },
                { target: ".nomatch" }],
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time} ?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry can you answer with yes or no?"),
                    on: { ENDSPEECH: "prompt" }
                },
            }
        },
        confirmationWholeDay: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "agree" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { agree: dict[context.recResult].agree } }),
                    target: "confirmation"
                },
                {   
                    cond: (context) => "refuse" in (dict[context.recResult] || {}),
                    actions: assign((context) => { return { refuse: dict[context.recResult].refuse } }),
                    target: "who"
                },
                { target: ".nomatch" }],
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry can you answer with yes or no?"),
                    on: { ENDSPEECH: "prompt" }
                },
            }
        },
        confirmation: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: { entry: say("Your appointment has been created!") }
            }
        }
    }
})
