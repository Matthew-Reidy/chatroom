
import{useState} from 'react'
import { ChatBox } from './components/chatbox';
import {userContext} from './util/context'


function App() {
  const [userName, setUserName] = useState(null)
  const [joinInit, setJoinInit] = useState(false)

  function toggleLoggedInScreen(){

     if(userName.match(/\s|^.{0,3}$/gm) === null ){
      setJoinInit(true)
     }else{
      alert("username must not contain spaces and be atleast 4 characters in length")
     }
  }

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center flex flex-col items-center space-y-4'>
        <userContext.Provider value={{userName, setUserName,  setJoinInit}}>
        {
          !joinInit ? <>
                        <label className='font-bold'>Enter Username</label>
                        <input className='border border-gray-300 rounded px-4 py-2' type='text' onChange={(e) => setUserName(e.target.value)}></input>
                        <button className='bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600' type='button' onClick={toggleLoggedInScreen}>Join chat</button>
                      </> 
                      : 
                      <>
                        <ChatBox/>
                      </>

        }
        </userContext.Provider>

      
      </div>
    </div>
    
  );
}

export default App;
