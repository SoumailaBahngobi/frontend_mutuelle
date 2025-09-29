 import React from 'react'
 import { useEffect } from 'react';
 import axios from 'axios';
 
 export default function ViewMember() {
     const [members, setMembers] = React.useState([]);
    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers =  async () => {
        const member = await axios.get("http://localhost:8080/mut/member");
        setMembers(member.data);
    }
   return (
     <div>
       <div className='container'>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Nom</th>
                        <th scope="col">Prénom</th>
                        <th scope="col">Email</th>
                        <th scope="col">NPI</th>
                        <th scope="col">Téléphone</th>
                        <th scope="col">Rôle</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member, index) => (
                        <tr>
                            <th scope="row">{index + 1}</th>
                            <td>{member.name}</td>
                            <td>{member.firstName}</td>
                            <td>{member.email}</td>
                            <td>{member.npi}</td>
                            <td>{member.phone}</td>
                            <td>{member.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
     </div>
   )
 }
 