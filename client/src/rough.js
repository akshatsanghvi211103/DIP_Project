// (typeof data["members"] === "undefined")
//     ? (< p > Loading... </p>)
//     : (data["members"].map((x, i) =>
//         (
//             <div key={i}>
//                 <p >{x}</p>
//                 <br></br>
//             </div>
//         )
//     ))






// .circle3 {
//     background-color: #cccbcc;
//     position: absolute;
//     right: 0;
//     top: 300px;
//     height: 250px;
//     width: 200px;
//     filter: blur(200px);

//     animation: circle3Animation 8s infinite linear;
// }

// .circle4 {
//     background-color: #222322;
//     position: absolute;
//     right: 0;
//     top: 300px;
//     height: 250px;
//     width: 200px;
//     filter: blur(200px);

//     animation: circle4Animation 8s infinite linear;
// }

// .circle5 {
//     background-color: #222322;
//     position: absolute;
//     top: 200px;
//     left: 200px;
//     height: 300px;
//     width: 300px;
//     filter: blur(250px);

//     animation: circle5Animation 8s infinite ease;
// }


// @keyframes circle3Animation {
//   0% {top: 250px; right: 0px; transform: scale(1);}
//   30% {top: 150px; right: 150px;transform: scale(1.4);}
//   60% {top: 250px; right: 100px;transform: scale(1);}
//   100% {top: 250px; right: 0px; transform: scale(1);}
// }

// @keyframes circle4Animation {
//   0% {top: 300px; right: 250px; transform: scale(1);}
//   30% {top: 100px; right: 150px;transform: scale(1.4);}
//   60% {top: 120px; right: 30px;transform: scale(1);}
//   100% {top: 300px; right: 250px; transform: scale(1);}
// }

// @keyframes circle5Animation {
//   0% {top: 200px; left: 200px; transform: scale(1);}
//   30% {top: 300px; left: 150px; transform: scale(1.8);}
//   60% {top: 100px; left: 200px; transform: scale(1.6);}
//   100% {top: 200px; left: 200px; transform: scale(1);}
// }