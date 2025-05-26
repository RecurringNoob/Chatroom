
import './App.css'
import { Router,Routes,Route } from 'react-router-dom'
import Home from "./pages/Home.jsx"
import Room from "./pages/Room.jsx"

function App() {
 

  return (
    
    <div className='app'>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/room/:roomID' element={<Room/>}/>
      </Routes>
    </div>
  )
}

export default App
