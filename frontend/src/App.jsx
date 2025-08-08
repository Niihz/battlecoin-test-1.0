import React, {useState, useEffect} from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App(){
  const [token,setToken] = useState(localStorage.getItem('bc_token')||'')
  const [me,setMe] = useState(null)
  const [nick, setNick] = useState('player'+Math.floor(Math.random()*999))

  useEffect(()=>{
    if(token) fetchMe()
  },[token])

  async function login(){
    try{
      const r = await axios.post(`${API}/login`,{nickname:nick})
      localStorage.setItem('bc_token', r.data.token)
      setToken(r.data.token)
      fetchMe()
    }catch(e){ alert('Login failed') }
  }
  async function fetchMe(){
    try{
      const r = await axios.get(`${API}/user`,{headers:{Authorization:'Bearer '+token}})
      setMe(r.data)
    }catch(e){ console.log(e) }
  }
  async function convert(coin){
    try{
      await axios.post(`${API}/convert`,{coin},{headers:{Authorization:'Bearer '+token}})
      fetchMe()
    }catch(e){ alert('Convert failed') }
  }
  async function mineOnce(){
    try{
      await axios.post(`${API}/mine`,{}, {headers:{Authorization:'Bearer '+token}})
      fetchMe()
    }catch(e){ alert('Mine failed') }
  }
  async function buy(){
    try{
      await axios.post(`${API}/buy`,{itemId:'rig_basic'},{headers:{Authorization:'Bearer '+token}})
      fetchMe()
    }catch(e){ alert('Buy failed') }
  }

  if(!token){
    return (<div className="center"><h1>BattleCoin (Test)</h1>
      <input value={nick} onChange={e=>setNick(e.target.value)} />
      <button onClick={login}>Login / Create</button>
      <p>Login creates a test account (no password) for quick testing.</p>
    </div>)
  }

  if(!me) return <div className="center">Loading...</div>

  return (<div className="app">
    <header>
      <h2>BattleCoin</h2>
      <div className="balances">
        <span>BTC: {me.wallet.btc.toFixed(6)}</span>
        <span>DOGE: {me.wallet.doge.toFixed(4)}</span>
        <span>LTC: {me.wallet.ltc.toFixed(6)}</span>
        <span>BTT: {me.wallet.btt.toFixed(2)}</span>
      </div>
    </header>
    <main>
      <section className="panel">
        <h3>Mine</h3>
        <button onClick={mineOnce}>Mine +0.1 BTT</button>
      </section>
      <section className="panel">
        <h3>Conversion</h3>
        <p>Click to convert simulated BTC/DOGE/LTC balances into BTT at 1 BTT = $1</p>
        <button onClick={()=>convert('btc')}>Convert BTC → BTT</button>
        <button onClick={()=>convert('doge')}>Convert DOGE → BTT</button>
        <button onClick={()=>convert('ltc')}>Convert LTC → BTT</button>
      </section>
      <section className="panel">
        <h3>Shop</h3>
        <p>Buy a basic rig that generates passive BTT.</p>
        <button onClick={buy}>Buy Rig (50 BTT)</button>
      </section>
      <section className="panel">
        <h3>Inventory</h3>
        <ul>
          {me.items.map(it=> <li key={it.id}>{it.id} - qty: {it.qty}</li>)}
        </ul>
      </section>
    </main>
    <footer className="center">
      <button onClick={()=>{ localStorage.removeItem('bc_token'); setToken(''); setMe(null)}}>Logout</button>
    </footer>
  </div>)
}

export default App
