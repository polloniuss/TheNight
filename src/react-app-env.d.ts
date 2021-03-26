/**Dialogue-based Game "The Night"

    Author: Vladislav Maraev
    Modifications by: Bérénice Le Glouanec
    Date of modification: 03/2021
    Course: LT2216 NML 50 DAG

    This typescript file is modificated as part of a university project.
**/
/// <reference types="react-scripts" />

declare module 'react-speech-kit';

interface SDSContext {
    recResult: string;
    nluData: any;
    ttsAgenda: string;
    work: string;
    party: string;
    call: string;
    sleep: string;
    agree: string;
    refuse: string;
    counter: any;
}

type SDSEvent =
    | { type: 'CLICK' }
    | { type: 'RECOGNISED' }
    | { type: 'ASRRESULT', value: string }
    | { type: 'ENDSPEECH' }
    | { type: 'LISTEN' }
    | { type: 'SPEAK', value: string };
