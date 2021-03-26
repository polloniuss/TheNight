import { MachineConfig, Action, assign, actions } from "xstate"
const { send, cancel } = actions

import { inspect } from '@xstate/inspect'
inspect({
  url: "https://statecharts.io/inspect",
  iframe: false
});

import { nluRequest } from "./index.tsx"
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/quotesGrammar.ts'

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}
function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}
function prompt(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt)
            }
        }
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
                ask: {
                    entry: [send('LISTEN'), send('MAXSPEECH', { delay: 8000, id: 'maxsp' })]
                },
                nomatch: {
                    entry: say(nomatch),
                    on: { ENDSPEECH: [{ 
                            actions: cancel('maxsp'),
                            target: "prompt" 
                    }] }
                },
                help: {
                    entry: say(help),
                    on: { ENDSPEECH: [{ 
                            actions: cancel('maxsp'),
                            target: "prompt" 
                    }] }
                }
        }
    })
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'start'
            }
        },
        start: {
            initial: 'welcome',
            on: {
                MAXSPEECH: [
                    { 
                        cond: (context) => context.counter === 1,
                        target: "second_call"
                    },
                    {
                        cond: (context) => context.counter === 2,
                        target: "last_call"
                    },
                    {
                        target: "first_call"
                    }
                ]
            },
            states: {
                hist: { type: 'history' },
                welcome: {
                    on: { RECOGNISED: 
                            {   actions: cancel('maxsp'),
                                target: 'query'
                            }
                    },
                    ...promptAndAsk("What do you want me to do?"),
                },
                query: {
                    invoke: {
                        id: 'rasa',
                        src: (context, event) => nluRequest(context.recResult),
                        onDone: {
                            actions: [ assign((context, event) => { return { nluData: event.data }}), cancel('maxsp')],
                            target: 'rasaChoice'
                        },
                        onError: {
                            actions: [ assign({ errorMessage: (context, event) => console.log(event.data)}), cancel('maxsp')],
                            target: 'failure',
                        }
                    }
                },
                failure: {
                    initial: "prompt",
                    on: { ENDSPEECH: "welcome" },
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
                    ...prompt("Actualization."),
                },
                appointment: {
                    ...prompt("Okay, let's create an appointment!"),
                    on: { ENDSPEECH: 
                            { actions: cancel('maxsp'),
                            target: "who" },
                    }
                },
                todo: {
                    ...prompt("Let's create a to-do list!"),
                    on: { ENDSPEECH: 
                            { actions: cancel('maxsp'),
                            target: "welcome" },
                    }
                },
                timer: {
                    ...prompt("Let's start a timer!"),
                    on: { ENDSPEECH: 
                            { actions: cancel('maxsp'),
                            target: "welcome" },
                    }
                },
                who: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "person" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { person: dict[context.recResult].person } }), cancel('maxsp')],
                            target: "day"

                        },
                        {
                            cond:(context) => "help" in (dict[context.recResult] || {}),
                            target: ".help"
                        },
                        { target: ".nomatch" }]
                    },
                    ...promptAndAsk("Who are you meeting with?","Sorry, I don't know them.", "You can say Jennifer or John for example.")
                },
                day: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "day" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { day: dict[context.recResult].day } }), cancel('maxsp')],
                            target: "duration"

                        },
                        {
                            cond:(context) => "help" in (dict[context.recResult] || {}),
                            target: ".help"
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
                            entry: [ 
                                send('LISTEN'),
                                send('MAXSPEECH', { delay: 8000, id: 'maxsp' })
                            ]
                        },
                        help: {
                            entry: say("You can say monday, tuesday and so on."),
                            on: { ENDSPEECH: [{ 
                                    actions: cancel('maxsp'),
                                    target: "prompt"
                            }] }
                        },
                        nomatch: {
                            entry: say("Sorry, can you repeat?"),
                            on: { ENDSPEECH: [{ 
                                    actions: cancel('maxsp'),
                                    target: "prompt"
                            }] }
                        },
                    }
                },
                duration: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "agree" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { agree: dict[context.recResult].agree } }), cancel('maxsp')],
                            target: "confirmationWholeDay"
                        },
                        {   
                            cond: (context) => "refuse" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { refuse: dict[context.recResult].refuse } }), cancel('maxsp')],
                            target: "time"
                        },
                        {
                            cond:(context) => "help" in (dict[context.recResult] || {}),
                            target: ".help"
                        },
                        { target: ".nomatch" }],
                    },
                    ...promptAndAsk("Will it take the whole day?","Sorry, can you repeat?", "You can answer with yes or no.")
                },
                time: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "time" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { time: dict[context.recResult].time } }), cancel('maxsp')],
                            target: "regularConfirmation"
                        },
                        {
                            cond:(context) => "help" in (dict[context.recResult] || {}),
                            target: ".help"
                        },
                        { target: ".nomatch" }]
                    },
                    ...promptAndAsk("What time is your meeting?","Sorry, can you repeat?", "You can choose between 8 to 12 or 1 to 6.")
                },
                regularConfirmation: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "agree" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { agree: dict[context.recResult].agree } }), cancel('maxsp')],
                            target: "confirmation"
                        },
                        {
                            cond:(context) => "help" in (dict[context.recResult] || {}),
                            target: ".help"
                        },
                        {   
                            cond: (context) => "refuse" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { refuse: dict[context.recResult].refuse } }), cancel('maxsp')],
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
                            entry: [ 
                                send('LISTEN'),
                                send('MAXSPEECH', { delay: 8000, id: 'maxsp' })
                            ]
                        },
                        help: {
                            entry: say("You can answer with yes or no."),
                            on: { ENDSPEECH: [{ 
                                    actions: cancel('maxsp'),
                                    target: "prompt"
                            }] }
                        },
                        nomatch: {
                            entry: say("Sorry can you repeat?"),
                            on: { ENDSPEECH: [{ 
                                    actions: cancel('maxsp'),
                                    target: "prompt"
                            }] }
                        },
                    }
                },
                confirmationWholeDay: {
                    initial: "prompt",
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "agree" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { agree: dict[context.recResult].agree } }), cancel('maxsp')],
                            target: "confirmation"
                        },
                        {   
                            cond: (context) => "refuse" in (dict[context.recResult] || {}),
                            actions: [ assign((context) => { return { refuse: dict[context.recResult].refuse } }), cancel('maxsp')],
                            target: "who"
                        },
                        {
                            cond:(context) => "help" in (dict[context.recResult] || {}),
                            target: ".help"
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
                            entry: [ 
                                send('LISTEN'),
                                send('MAXSPEECH', { delay: 8000, id: 'maxsp' })
                            ]
                        },
                        help: {
                            entry: say("You can answer with yes or no."),
                            on: { ENDSPEECH: [{ 
                                    actions: cancel('maxsp'),
                                    target: "prompt"
                            }] }
                        },
                        nomatch: {
                            entry: say("Sorry can you repeat?"),
                            on: { ENDSPEECH: [{ 
                                    actions: cancel('maxsp'),
                                    target: "prompt"
                            }] }
                        },
                    }
                },
                confirmation: {
                    ...prompt("Your appointment has been created!"),
                    on: { ENDSPEECH: "welcome" }
                }
            }
        },
        first_call: {
            entry: say("Please focus on my question."),
            on: {
                ENDSPEECH: [
                    {
                        cond: (context) => context.counter === 1,
                        target: "#root.dm.start.hist"
                    },
                    {
                        cond: (context) => context.counter === 2,
                        target: "#root.dm.start.hist"
                    },
                    {
                        cond: (context) => context.counter === 3,
                        target: "#root.dm.start.hist"
                    },
                ],
            }
        },
        second_call: {
            entry: say("Are you still listening?"),
            on: {
                ENDSPEECH: [
                    {
                        cond: (context) => context.counter === 1,
                        target: "#root.dm.start.hist"
                    },
                    {
                        cond: (context) => context.counter === 2,
                        target: "#root.dm.start.hist"
                    },
                    {
                        cond: (context) => context.counter === 3,
                        target: "#root.dm.start.hist"
                    },
                ],
            }
        },
        last_call: {
            entry: say("Whatever, I don't want to listen anymore."),
            on: {
                ENDSPEECH: [
                    {
                        cond: (context) => context.counter === 1,
                        target: "#root.dm.start.hist"
                    },
                    {
                        cond: (context) => context.counter === 2,
                        target: "#root.dm.start.hist"
                    },
                    {
                        cond: (context) => context.counter === 3,
                        target: "#root.dm"
                    },
                ],
            }
        },
    }
})

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
    "help": { help: "help" },
    "I don't understand": { help: "help" },
    "please help": { help: "help" },
    "can you repeat": { help: "help" },
    "let's go back": { help: "help" },
}