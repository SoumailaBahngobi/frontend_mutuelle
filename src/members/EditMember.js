import React from 'react'
import { useEffect } from 'react';
import axios from 'axios';

function EditMember() {
    const [members, setMembers] = React.useState([]);
    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers =  async () => {
        const member = await axios.get("http://localhost:8080/mut/member");
        setMembers(member.data);
    }
  return (
    <div>EditMember</div>
  )
}

export default EditMember