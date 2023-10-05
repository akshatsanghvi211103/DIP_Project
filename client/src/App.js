
import React, {useState, useEffect} from 'react';
import './App.css';
import Main from './Main';

function App() {

    const [data, setData] = useState([{}])

    // useEffect(() => {
    //     fetch("/members").then(
    //         res => res.json()
    //     ).then(
    //         data1 => {
    //             setData(data1)
    //             console.log(data1)
    //         }
    //     )

    // }, [])

    return (
        <div>
            <Main />
        </div>
    );
}

export default App;
