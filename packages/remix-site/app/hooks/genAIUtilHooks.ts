//hotkeys, will need to put them in the main logic hook
// // useEffect(() => {
// //     function onKeyDown(e) {
// //         const { altKey, ctrlKey, shiftKey, key, defaultPrevented } = e;
// //         if (defaultPrevented)
// //             return;
// //         switch (`${altKey}:${ctrlKey}:${shiftKey}:${key}`) {
// //         case 'false:false:true:Enter':
// //         case 'false:true:false:Enter':
// //             predict();
// //             break;
// //         case 'false:false:false:Escape':
// //             cancel();
// //             break;
// //         case 'false:true:false:r':
// //         case 'false:false:true:r':
// //             undoAndPredict();
// //             break;
// //         case 'false:true:false:z':
// //         case 'false:false:true:z':
// //             if (cancel || !undo()) return;
// //             break;
// //         case 'false:true:true:Z':
// //         case 'false:true:false:y':
// //         case 'false:false:true:y':
// //             if (cancel || !redo()) return;
// //             break;

// //         default:
// //             keyState.current = e;
//             return;
//         }
//         e.preventDefault();
//     }
//     function onKeyUp(e) {
//         const { altKey, ctrlKey, shiftKey, key, defaultPrevented } = e;
//         if (defaultPrevented)
//             return;
//         keyState.current = e;
//     }

//     window.addEventListener('keydown', onKeyDown);
