import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import ReactLogo from './assets/react.svg?react'  // Lesson 5 (Extend with Plugins): To use the SVGR Vite Plugin, 
                                                  // you need to add a '?react' at the back of the path as specified by the documentation
import scrimbaLogo from './assets/scrimba.png'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  const greeting = import.meta.env.VITE_GREETING
  const apiUrl = import.meta.env.VITE_API_URL
  const [count, setCount] = useState(0)

  {/* Lesson 3 (Environment Variables) (Challenge): (Extra code given) Create the environment variables 
    '.env' file in the project's root folder. Then use the 'VITE_GREETING' environment variable into this 
    main JSX file, 'App.jsx' in Vite website from the '.env' file in this 'useEffect' function*/}

  {/*Use this state variable in the UI*/}
  const [ipAddress, setIpAddress] = useState("")

  useEffect(() => {
    const fetchIpAddress = async () => {
      {/*Use the environment variable here*/}
      const apiUrl = import.meta.env.VITE_API_URL

      try {
        const response = await fetch(`${apiUrl}?format=json`)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        setIpAddress(data.ip)
      } catch (err) {
        setIpAddress("NOT AVAILABLE")
        console.error(err.message)
      }
    }

    fetchIpAddress()
  }, [])


  return (
    <>
      <Header />    {/*Lesson 1 (Experience Fast Development): Bringing the Header component into this main JSX file, 'App.jsx' in Vite website from the 'Header' component*/}
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://react.dev" target="_blank">      {/*Lesson 5 (Extend with Plugins): Adding the modified react logo by the SVGR Plugin 'ReactLogo' component 
                                                            into this main JSX file, 'App.jsx' in Vite website*/}
          <ReactLogo className="logo react"/>
        </a>
        <a href="https://scrimba.dev" target="_blank">    {/* Lesson 2 (Handle Static Assets): Adding another 'png' image into this main JSX file, 'App.jsx' in Vite website from the 'src/assets' folder*/}
          <img src={scrimbaLogo} className="logo scrimba" alt="Scrimba logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <h2>{greeting}</h2>   {/*Lesson 3 (Environment Variables): Create the environment variables '.env' 
                              file in the project's root folder. Then use the 'VITE_GREETING' environment 
                              variable into this main JSX file, 'App.jsx' in Vite website from the '.env' file*/}

      <h3>Your IP address is {ipAddress}</h3> {/*Lesson 3 (Environment Variables) (Challenge): Use the 'ipAddress' variable here*/}

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <Footer />    {/*Lesson 1 (Experience Fast Development) (Challenge): Bringing the Footer component into the main JSX file, 'App.jsx' in Vite from the 'Footer' component*/}
    </>
  )
}

export default App
