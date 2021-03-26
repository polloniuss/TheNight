/**Dialogue-based Game "The Night"

    Author: Bérénice Le Glouanec
    Date of creation: 03/2021
    Course: LT2216 NML 50 DAG

    Goal of the game: The game lasts 5 turns during which he will be 
        asked to choose between 4 different actions. Each chosen action 
        has an impact on the player's game experience. There is a set 
        of different reactions from the talking bot to avoid redundancy 
        and encourage players to try various endings.

    This typescript file is created as part of a university project.
**/


//Imports
import { MachineConfig, Action, assign, actions } from "xstate"
const { send, cancel } = actions
import { inspect } from '@xstate/inspect'
inspect({ url: "https://statecharts.io/inspect", iframe: false });
import { nluRequest } from "./index.tsx"

//Constants
//**Initializing scores
const resetScores: Action<SDSContext, SDSEvent> = 
    assign((context) => {
        return { scoreSleep: 2, scoreWork: 0, scoreCall: 0, scoreParty: 0, night: 5, projectSubmitted: 0, withoutfriends: false, question: false, confettiEverywhere: false }
})
//**Confetti properties
const confettiActivated: Action<SDSContext, SDSEvent> =
    assign((context) => { return { confettiEverywhere: true} })
//**Gives different sentences for each states to avoid redundancy during the game
const sentencesWork = ["Wow, impressive work.",
                        "Oh my god that looks so hard, I'm glad to be able to do your homework in less than 5 seconds.",
                        "You're done but you're still so far from the end.",
                        "I would have done better. But nice try.",
                        "You haven't done the VG part yet. You might be more efficient after a call with your mother.",
                        "Oh! I didn't expected this from you. I hope that you worked hard. Do you think that was enough?"];
const sentencesCall = ["Wow, impressive call.",
                        "Your mother spent the night asking what linguistics are and why you didn't study something understandable",
                        "Thanks to this call, you now know that Benjamin who was studying with you in 4th grade is now married and has two kids.",
                        "You spent the night trying to configure and initialize your mother's new computer.",
                        "I'm a bit jealous that you spent so much time with your mother and not me. But, ok, fair.",
                        "Did you understand the aim of the game? Are you already lost? Fortunately, you can always ask how to play to your mom during your call."];
const sentencesSleep = ["Wow impressive sleep.",
                        "You made so many funny sounds during your sleep! So I recorded and posted them on Youtube.",
                        "Oh ? So you do need to sleep after a few hours? I'm so happy to be a robot. Well, good night, I'm going to multitask in the meantime.",
                        "You spent your night drooling on your pillow. Well done, it's your best performance so far.",
                        "Sweet dreams, rest well. Do not think about that big homework that you have to return in a short time.",
                        "You just started the game and you already choose to sleep? Nice! What a productive choice."];
const sentencesParty = ["Wow, impressive party.",
                        "If I had known you were going to a party, I would have waited for your hangover to pass before coming back talking to you. I hate repeating the same sentences over and over again.",
                        "It was embarrassing yesterday. If you don't remember the party, it's probably better.",
                        "Do you even know what day it is? Did you really need this break?",
                        "It was embarrassing yesterday. If you don't remember the party, it's probably better.",
                        "How was your evening, the drinks, the music, the games?... And also, what about your homework? Is it progressing?"];
const sentencesQuestion = ["I wonder if you will choose the action I'm thinking about... So, what are you doing?",
                        "So what are we doing? Careful, this choice is more important than the others one. Or not.",
                        "What are you doing tonight? Please choose wisely. Like, take your time, this is a really important choice.",
                        "What do you want to do tonight?",
                        "What surprising and imprevisible choice are you taking tonight?"];

const sentencesQuestionFriends = ["Wow impressive choice without friends.",
                        "What are you going to do without friends tonight? Oh, probably same as yesterday.",
                        "To avoid overwork you will only have to choose among 3 actions this time. So, what's the plan?",
                        "Funny choice yesterday. Hope you think twice about it tonight. What's your plan?",
                        "What are you going to do without friends tonight? Oh, probably same as yesterday."]

const sentencesFriends = ["Wow impressive choice.",
                        "You didn't choose your friends last night, so they didn't choose you tonight. You won't be able to party. Enjoy your fun evening",
                        "You didn't choose your friends last night, so they didn't choose you tonight. You won't be able to party. Enjoy your fun evening",
                        "Your friends are sensitive, and took it badly that you didn't go to their party yesterday. They decided not to invite you today.",
                        "You didn't choose your friends last night, so they didn't choose you tonight. You won't be able to party. Enjoy your fun evening"]


//Functions
//**Decrements each value without returning negative integers
function giveScores(context:SDSContext){
    if (context.scoreSleep < 1){ context.scoreSleep = 0 }
    else { context.scoreSleep = context.scoreSleep - 1 }

    if (context.scoreWork < 1){ context.scoreWork = 0 }
    else { context.scoreWork = context.scoreWork - 1 }

    if (context.scoreCall < 1){ context.scoreCall = 0 }
    else { context.scoreCall = context.scoreCall - 1 }

    if (context.scoreParty < 1){ context.scoreParty = 0 }
    else { context.scoreParty = context.scoreParty - 1 }

    return context.scoreSleep, context.scoreWork, context.scoreCall, context.scoreParty
}
//**Counts a new night and passes to another one
function nextNight(context:SDSContext){
    context.night = context.night - 1
    return `There is ${context.night} night left before the deadline.`
}
//**Functions for saying, listening or asking during a state
function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}
function listen(): Action<SDSContext, SDSEvent> { return send('LISTEN') }
function prompt(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: { prompt: { entry: say(prompt) } }
    })
}
function promptAndAsk(prompt: string, nomatch: string, help: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: { entry: send('LISTEN') }
        }
    })
}

//Main Machine
export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: { on: { CLICK: 'scenario' } },

        scenario: {
            initial: "prompt",
            on: { 
                ENDSPEECH: {
                    actions: resetScores,
                    target: "night"
                }
            },
            ...prompt("Hi, I would describe myself as the nicer bot you've ever seen. Or not. But I have to help you if you need it, so don't hesitate to say 'help me' at any time. But not too much, I don't like repeating myself. Let's talk about this game. We are on monday evening, and you're having exams everyday. But you just realized that you have a big project to submit on friday night! You have 5 nights before the deadline. What should you do ? You better know your priorities this week ...")
        },

        night: {
            on: { RECOGNISED: { target: 'query' } },
            ...promptAndAsk(sentencesQuestion[1])
        },

        nightWithoutFriends: {
            on: { RECOGNISED: { target: 'query' } },
            ...promptAndAsk(sentencesQuestionFriends[2])
        },

        playAgain: {
            on: { RECOGNISED: { 
                    actions: assign((context:SDSContext) => { return { question: true } }),
                    target: 'query'
                }
            },
            ...promptAndAsk("Do you want to play again and try another of the 11 possible ends?")
        },

        endGame: {
            initial: "prompt",
            on: { 
                ENDSPEECH: {
                    actions: resetScores,
                    target: "init"
                }
            },
            ...prompt("It was nice to play! Even if I'm the only one to win everytime.")
        },

        //A request is made to nluData (from Heroku app), depending on the player's sentence and his progress in the game, it is targeting a specific state.
        query: {
            invoke: {
                id: 'rasa',
                src: (context, event) => nluRequest(context.recResult),
                onDone: [
                    {
                        cond: (context) => (context.withoutfriends === true) && (context.question === false),
                        actions: assign((context, event) => { return { nluData: event.data }}),
                        target: 'choiceWithoutParty'
                    },
                    {
                        cond: (context) => (context.withoutfriends === false) && (context.question === false),
                        actions: assign((context, event) => { return { nluData: event.data }}),
                        target: 'choice'
                    },
                    {
                        cond: (context) => context.question === true,
                        actions: assign((context, event) => { return { nluData: event.data }}),
                        target: 'questionPlay'
                    },
                ],
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
                prompt: { entry: say("There is an error with Rasa or the NLU data. Please check your proxy, request a temporary access to the demo server on 'cors anywhere'. And open 'nlu-heroku.herokuapp.com'.") }
            }
        },

        choice: {
            on: {
                ENDSPEECH: [{
                    cond: (context) =>  context.nluData.intent.name === 'sleep',
                    target: "sleep"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'work',
                    actions: assign((context) => { return { projectSubmitted: 1 } }),
                    target: "work"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'call',
                    target: "call"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'party',
                    target: "party"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'help',
                    target: "help"
                },
                { target: "night" }]
            },
            ...prompt("...")
        },

        help: {
            on: { ENDSPEECH: "night" },
            ...prompt("Am I explaining so badly? Basically you can choose between 'work', 'call', 'party' or 'sleep'. For example you can answer 'I want to work on my project' as it's obviously the aim of the game...")
        },

        choiceWithoutParty: {
            on: {
                ENDSPEECH: [{
                    cond: (context) =>  context.nluData.intent.name === 'sleep',
                    actions: assign((context) => { return { scoreParty: context.scoreParty+2, withoutfriends: false } }),
                    target: "sleep"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'work',
                    actions: assign((context) => { return { scoreParty: context.scoreParty+2, projectSubmitted: 1, withoutfriends: false } }),
                    target: "work"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'call',
                    actions: assign((context) => { return { scoreParty: context.scoreParty+2, withoutfriends: false } }),
                    target: "call"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'help',
                    target: "helpWithoutFriends"
                },
                { target: "nightWithoutFriends" }]
            },
            ...prompt("...")
        },

        helpWithoutFriends: {
            on: { ENDSPEECH: "nightWithoutFriends" },
            ...prompt("Come on, you managed to answer at the begining, this is not so different! As I said, you can choose between 'work', 'call' or 'sleep' but not 'party'! Because you just hurt your friends! For example you can answer 'I want to sleep' as it's obviously already your state...")
        },

        questionPlay: {
            ...prompt("..."),
            on: { ENDSPEECH: [{
                    cond: (context) =>  context.nluData.intent.name === 'agree',
                    target: "scenario"
                },
                {   
                    cond: (context) =>  context.nluData.intent.name === 'refuse',
                    target: "endGame"
                },
                {
                    cond: (context) =>  context.nluData.intent.name === 'help',
                    target: "helpQuestion"
                },
                { target: "playAgain" }],
            },
        },

        helpQuestion: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("I just want to know if you still want to play with me or if you're a bad player. You can either answer 'yes it was so funny I want to play again please' or 'no thank you'")
        },

        //On each action the player will get +3 (but the day after every activity loose one point, so the actual score is +2 for an activity).
        sleep: {
            entry: send((context)=>({ type: "SPEAK", value: (sentencesSleep[context.night]) })),
            on: { 
                 ENDSPEECH: 
                {
                    actions: [ assign((context:SDSContext) => { return { scoreSleep: context.scoreSleep+3 } }), giveScores ],
                    target: 'countNight' 
                }
            }
        },
        work: {
            entry: send((context)=>({ type: "SPEAK", value: sentencesWork[context.night] })),
            on: { 
                ENDSPEECH: {
                    actions: [ assign((context:SDSContext) => { return { scoreWork: context.scoreWork+3 } }), giveScores ],
                    target: 'countNight' 
                }
            },
        },
        call: {
            entry: send((context)=>({ type: "SPEAK", value: sentencesCall[context.night] })),
            on: { 
                ENDSPEECH: {
                    actions: [ assign((context:SDSContext) => { return { scoreCall: context.scoreCall+3 } }), giveScores ],
                    target: 'countNight' 
                 }
            }
        },
        party: {
            entry: send((context)=>({ type: "SPEAK", value: sentencesParty[context.night] })),
            on: { 
                ENDSPEECH: {
                    actions: [ assign((context:SDSContext) => { return { scoreParty: context.scoreParty+3 } }), giveScores ],
                    target: 'countNight' 
                }
            }
        },

        countNight: {
            entry: send((context)=>({ type: "SPEAK", value: nextNight(context) })),
            on: { ENDSPEECH: { target: 'checkValues' } }
        },

        //Depending on the scores, the game will change the opportunities
        checkValues: {
            ...prompt("..."),
            on: { ENDSPEECH: [
                    {
                        cond: (context) => context.night === 0,
                        target: "winScore"
                    },
                    {
                        cond: (context) => context.scoreSleep === 0,
                        actions: assign((context) => { return { projectSubmitted: 0 } }),
                        target: "youNeedToSleep"
                    },
                    {
                        cond: (context) => context.scoreParty === 0,
                        actions: assign((context) => { return { projectSubmitted: 0, withoutfriends: true } }),
                        target: "youWontParty"
                    },
                    {   
                        actions: assign((context) => { return { projectSubmitted: 0 } }),
                        target: "night"
                    }
                ]
            }
        },

        youNeedToSleep: {
            on: { ENDSPEECH: "sleep" },
            ...prompt("You haven't sleep for the last 2 days! You're so tired that you just fall asleep on the floor. You won't be able to do anything else tonight.")
        },

        youWontParty: {
            on: { ENDSPEECH: "nightWithoutFriends" },
            ...prompt(sentencesFriends[1])
        },

        winScore:{
            always: [
                // Winning high score
                {
                    cond: (context) => context.scoreParty === 7,
                    target: "winPartyHigh"
                },
                {
                    cond: (context) => context.scoreCall === 7,
                    target: "winCallHigh"
                },
                {
                    cond: (context) => (context.scoreWork===7) && (context.projectSubmitted===1),
                    actions: confettiActivated,
                    target: "superWinWorkHigh"
                },
                {
                    cond: (context) => context.scoreSleep === 12,
                    target: "winSleepHigh"
                },

                // Winning medium score
                {
                    cond: (context) => context.scoreParty >= 3,
                    target: "winPartyMedium"
                },
                {
                    cond: (context) => context.scoreCall === 4,
                    target: "winCallMedium"
                },
                {
                    cond: (context) => (context.scoreWork===4) && (context.projectSubmitted===1),
                    actions: confettiActivated,
                    target: "superWinWorkMedium"
                },
                {
                    cond: (context) => context.scoreWork === 4,
                    target: "winWorkMedium"
                },
                {
                    cond: (context) => context.scoreSleep >= 6,
                    target: "winSleepMedium"
                },

                // Winning low score
                {
                    cond: (context) => (context.scoreWork===2) && (context.projectSubmitted===1),
                    actions: confettiActivated,
                    target: "superWinWorkLow"
                },
                { 
                    actions: confettiActivated,
                    target: "winMultiTasks" 
                },
            ]
        },

        superWinWorkHigh: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("Well done! You sent your work, you made a great program, you deserve a VG. Your mom is so proud of you but that's all. Your friends are so hurt by your behaviour.")
        },
        winPartyHigh: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("You drunk so much! Your liver hurts, you forgot to submit your project and you forgot your mom's birthday. But you had a nice week... Right?")
        },
        winCallHigh: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("Your mom don't know how to get rid of you. You called every night. You lost all your friends and you didn't even think about sending your work. Oh, sorry, you haven't started it yet.")
        },
        winSleepHigh: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("You slept during the whole week. You merged to your bed. Your friends can't recognize you anymore. Your work haven't been submitted and you have more than 50 messages from your mother.")
        },

        winCallMedium: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("Your mom appreciated all the time she spent with you, we can't say the same about your friends.")
        },
        winPartyMedium: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("Are you sure about all your choices? I'm not trying to manage your own life but it seems that you did all except work. So you're deprised of dessert for tonight.")
        },
        superWinWorkMedium: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("You sent your project on time, you worked and you did another task. I'm really impressed by you even if you could have done something better.")
        },
        winWorkMedium: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("I hope that your professor will be nice with you because to me it was a draft. But nice try.")
        },
        winSleepMedium: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("You slept 4 times in one week. But you had an objective at the beginning! Why did you sleep so much? Are you exhausted by your project?")
        },

        superWinWorkLow: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("So you decided to work the last day hoping that it will be enough. It's not. But at least you submitted your draft to your professor.")
        },
        winMultiTasks: {
            on: { ENDSPEECH: "playAgain" },
            ...prompt("You won the 'multitasks end'. I don't know how to summarize your week because you tried to do everything but you ended up doing nothing correctly.")
        },
    }
})