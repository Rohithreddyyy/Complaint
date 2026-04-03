import { useEffect, useState } from "react";
import API from "../services/api";

function Column({title,color,data}){
  return(
    <div style={{
      flex:1,
      background:"rgba(255,255,255,0.05)",
      padding:"15px",
      borderRadius:"18px",
      backdropFilter:"blur(20px)"
    }}>
      <h3 style={{color}}>{title}</h3>

      {data.map(c=>(
        <div key={c.id} style={{
          background:"rgba(0,0,0,0.4)",
          padding:"12px",
          borderRadius:"12px",
          marginTop:"10px"
        }}>
          <b>{c.title}</b>
          <p style={{fontSize:"13px"}}>{c.department}</p>
        </div>
      ))}
    </div>
  )
}

function AdminBoard(){

  const [list,setList] = useState([]);

  useEffect(()=>{
    API.get("/complaints").then(res=>setList(res.data));
  },[]);

  return(
    <div>
      <h2>Admin Control Panel</h2>

      <div style={{display:"flex",gap:"20px"}}>
        <Column
          title="OPEN"
          color="#facc15"
          data={list.filter(c=>c.status==="OPEN")}
        />

        <Column
          title="IN PROGRESS"
          color="#fb923c"
          data={list.filter(c=>c.status==="IN_PROGRESS")}
        />

        <Column
          title="CLOSED"
          color="#4ade80"
          data={list.filter(c=>c.status==="CLOSED")}
        />
      </div>
    </div>
  )
}

export default AdminBoard;