// import { BsChatDots } from 'react-icons/bs';
// import React, { useRef, useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { CSSTransition } from 'react-transition-group';
// import CloseButton from 'react-bootstrap/CloseButton';
// import prabowo from '../../assets/images/prabowo.jpg';
// import jokowi from '../../assets/images/jokowi.jpeg';
// import db from '../../Config/Firebase';
// import { collection, getDocs, addDoc, updateDoc, doc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import './chat.css';
// import { MdArrowBackIos } from 'react-icons/md';
// import { IoIosSend } from 'react-icons/io';

// const ButtonChat = () => {
//   const isMobile = window.innerWidth <= 768;
//   const [showChatList, setShowChatList] = useState(false);
//   const [showChat, setShowChat] = useState(false);
//   const [chatName, setChatName] = useState('');
//   const [chatUID, setChatUID] = useState('');
//   const [chatText, setChatText] = useState('');
//   const [chatProfilePicture, setChatProfilePicture] = useState('');
//   const navigate = useNavigate();
//   const [dataChatFromDB, setDataChatFromDB] = useState([]);

//   const userData = localStorage.getItem('user');
//   const user = userData ? JSON.parse(userData) : null;

//   const toggleChatList = () => {
//     setShowChatList(!showChatList);
//   };

//   const toggleChat = () => {
//     setShowChat(!showChat);
//   };

//   const handleSendChat = async () => {
//     try {
//       // Get the current date
//       const currentDate = new Date();

//       // Format the time as '22:01'
//       const waktu = currentDate.toLocaleTimeString('en-GB', {
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//       });

//       // Format the date as 'Kamis, 30 Mei 2024'
//       const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
//       const tanggal = currentDate.toLocaleDateString('id-ID', options);

//       const docRef = await addDoc(collection(db, 'Chat'), {
//         to: chatUID,
//         from: user.uid,
//         text: chatText,
//         waktu: waktu,
//         tanggal: tanggal,
//         submitDate: currentDate,
//       });

//       await updateDoc(doc(db, 'Chat', docRef.id), {
//         id: docRef.id,
//       });

//       setChatText('');
//     } catch (e) {
//       console.error('Error adding comment: ', e);
//     }
//   };


//   useEffect(() => {
//     const unsubscribe = onSnapshot(query(collection(db, 'Chat'), orderBy('submitDate', 'asc')), (querySnapshot) => {
//       const dataChatFromDB = querySnapshot.docs.map(doc => doc.data());
//       setDataChatFromDB(dataChatFromDB);
//     });

//     console.log(dataChatFromDB);
//     return () => unsubscribe();
//   }, []);

//   return (
//     <div>
//       {!showChatList && (
//         <div id="tidak-tercetak">
//           <button
//             onClick={toggleChatList}
//             style={{ border: 'none', width: '60px', height: '60px', borderRadius: '100%', backgroundColor: "#6051f1", }}
//             className="buttonChat d-flex justify-content-center align-items-center fixed-bottom m-5 ms-auto shadow"

//           >
//             <BsChatDots style={{ width: '30px', height: '30px', color: 'white' }} />
//           </button>
//         </div>

//       )}

//       <CSSTransition
//         in={showChatList}
//         timeout={300}
//         classNames="chat"
//         unmountOnExit
//       >
//         <div className="float-end shadow overflow-auto" style={{ position: 'fixed', bottom: '-30px', right: isMobile ? '0px' : '30px', zIndex: '999', borderRadius: '30px', borderColor: "green", backgroundColor: "white", width: isMobile ? "100%" : "25vw", }}>
//           <div className="chatHeader d-flex justify-content-between"
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               position: "sticky",
//               top: 0,
//               background: 'linear-gradient(to right, #4B39EF, #6A4BEF)',
//               zIndex: 3,
//               padding: "10px",
//               cursor: "pointer"
//             }}>
//             <h4 className="fw-semibold text-light mt-2">Chat</h4>
//             <CloseButton onClick={toggleChatList} />
//           </div>
//           <div className='overflow-auto' style={{ height: "70vh", width: isMobile ? "100%" : "25vw" }}>
//             <div style={{ height: "20px" }}></div>

//             <div style={{ display: user.uid === "fYpdHwXRDLhj5XGxM5FZIAvxp9E2" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('Alfen'); setChatUID('fYpdHwXRDLhj5XGxM5FZIAvxp9E2'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>Alfen</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2') || (item.from === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "6D4XVa5BSSOl1ugUlkDlTea2COX2" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('Azwad'); setChatUID('6D4XVa5BSSOl1ugUlkDlTea2COX2'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2Flogo%201.jpg?alt=media&token=72ebd877-08fd-4c61-8549-9f406de27844'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2Flogo%201.jpg?alt=media&token=72ebd877-08fd-4c61-8549-9f406de27844" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>Azwad</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === '6D4XVa5BSSOl1ugUlkDlTea2COX2') || (item.from === '6D4XVa5BSSOl1ugUlkDlTea2COX2' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "ilWnMSyoNmar1LPbsCGrCQE92V83" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('Drs Jastro'); setChatUID('ilWnMSyoNmar1LPbsCGrCQE92V83'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FCuplikan%20layar%202024-05-29%20113120.png?alt=media&token=d4a0a378-e2ec-4199-8090-290191dacfda'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FCuplikan%20layar%202024-05-29%20113120.png?alt=media&token=d4a0a378-e2ec-4199-8090-290191dacfda" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>Drs Jastro</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === 'ilWnMSyoNmar1LPbsCGrCQE92V83') || (item.from === 'ilWnMSyoNmar1LPbsCGrCQE92V83' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "P7YKgj4NBZQFIA8LxVcow5LmYzI2" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('labib annazhif'); setChatUID('P7YKgj4NBZQFIA8LxVcow5LmYzI2'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>labib annazhif</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === 'P7YKgj4NBZQFIA8LxVcow5LmYzI2') || (item.from === 'P7YKgj4NBZQFIA8LxVcow5LmYzI2' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "gwsOqUgVXSPyWFMMHr4bJteBoYs1" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('Lina'); setChatUID('gwsOqUgVXSPyWFMMHr4bJteBoYs1'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>Lina</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1') || (item.from === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "4WGPaHicKWYr0Ny84IUh8xb9Bo62" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('P. Dhe'); setChatUID('4WGPaHicKWYr0Ny84IUh8xb9Bo62'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FCuplikan%20layar%202024-05-29%20223006.png?alt=media&token=0f31e2b1-366f-4ed6-9457-3efc94cfc6ba'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FCuplikan%20layar%202024-05-29%20223006.png?alt=media&token=0f31e2b1-366f-4ed6-9457-3efc94cfc6ba" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>P. Dhe</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === '4WGPaHicKWYr0Ny84IUh8xb9Bo62') || (item.from === '4WGPaHicKWYr0Ny84IUh8xb9Bo62' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "w4M5JJjgGQeHFbS2nkyoCfUBE532" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('Rakev'); setChatUID('w4M5JJjgGQeHFbS2nkyoCfUBE532'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-manager-b97dc.appspot.com/o/images%2Frakev.jpg?alt=media&token=7f639276-19dc-4709-bbc7-bb3c8e276bb9'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-manager-b97dc.appspot.com/o/images%2Frakev.jpg?alt=media&token=7f639276-19dc-4709-bbc7-bb3c8e276bb9" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>Rakev</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === 'w4M5JJjgGQeHFbS2nkyoCfUBE532') || (item.from === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "Q3LWLX4D7Ye8hMnQVF9fa7SZb953" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('Xena'); setChatUID('Q3LWLX4D7Ye8hMnQVF9fa7SZb953'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>Xena</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953') || (item.from === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//               <hr />
//             </div>

//             <div style={{ display: user.uid === "bgrij28h3EbkY9RQw3QsuA9Doiw1" ? 'none' : 'block' }}>
//               <div className="px-2 d-flex rounded-3" onClick={() => { setShowChat(true); setChatText(''); setChatName('Zahra'); setChatUID('bgrij28h3EbkY9RQw3QsuA9Doiw1'); setChatProfilePicture('https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8'); }}>
//                 <img src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/images%2FprofilePicture.jpeg?alt=media&token=b52a6fdb-ed43-437c-a6cc-7b5894066ea8" alt="" style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid black" }} className="img-fluid" />
//                 <div className="ms-3">
//                   <h6>Zahra</h6>
//                   <small style={{ fontSize: '14px' }}>
//                     {dataChatFromDB
//                       .filter(item => (item.from === user.uid && item.to === 'bgrij28h3EbkY9RQw3QsuA9Doiw1') || (item.from === 'bgrij28h3EbkY9RQw3QsuA9Doiw1' && item.to === user.uid))
//                       .slice(-1)
//                       .map((item, index) => (
//                         <span key={index}>{item.text}</span>
//                       ))
//                     }
//                   </small>
//                 </div>
//               </div>
//             </div>

//             <div style={{ height: "50px" }}></div>
//           </div>
//         </div>
//       </CSSTransition>


//       {showChat && (
//         <div
//           className="float-end overflow-auto"
//           style={{
//             position: 'fixed',
//             bottom: '-30px',
//             right: isMobile ? '0px' : '30px',
//             zIndex: '999',
//             borderRadius: '30px',
//             borderColor: 'green',
//             backgroundColor: 'white',

//             width: isMobile ? "100%" : "25vw",
//             display: 'flex',
//             flexDirection: 'column' // Menjadikan Flexbox untuk layout vertikal
//           }}
//         >
//           <div
//             className="chatHeader d-flex justify-content-between"
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               position: 'sticky',
//               top: 0,
//               background: 'linear-gradient(to right, #4B39EF, #6A4BEF)',
//               zIndex: 3,
//               padding: '10px',
//               cursor: 'pointer'
//             }}
//           >
//             <img
//               src={chatProfilePicture}
//               alt=""
//               style={{
//                 width: isMobile ? '30px' : '40px',
//                 height: isMobile ? '30px' : '40px',
//                 backgroundColor: 'white',
//                 borderRadius: '100%',
//                 marginRight: '5px',
//                 border: '2px solid black'
//               }}
//               className="img-fluid"
//             />
//             <h4 className="fw-semibold text-light mt-2" style={{ marginLeft: "-30px" }}>{chatName}</h4>
//             <MdArrowBackIos onClick={toggleChat} />
//           </div>
//           <div style={{ height: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

//             <div className='p-3' style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
//               {dataChatFromDB
//                 .filter(item => (item.from === user.uid && item.to === chatUID) || (item.from === chatUID && item.to === user.uid))
//                 .map((item, index, arr) => {
//                   // Check if the next item's time is the same as the current item's time
//                   const isLastInGroup = (index === arr.length - 1) || (item.waktu !== arr[index + 1].waktu);
//                   // Check if the next item's date is different from the current item's date
//                   const isNewDateGroup = (index === 0) || (item.tanggal !== arr[index - 1].tanggal);

//                   return (
//                     <React.Fragment key={index}>
//                       {isNewDateGroup && (
//                         <div style={{ textAlign: 'center', margin: '10px 0' }}>
//                           <small style={{ color: "grey" }}>{item.tanggal}</small>
//                         </div>
//                       )}
//                       <div style={{ alignSelf: item.from === user.uid ? 'flex-end' : 'flex-start' }}>
//                         <span style={{
//                           backgroundColor: item.from === user.uid ? "rgba(0, 119, 255)" : "rgba(220, 220, 220)",
//                           color: item.from === user.uid ? "white" : "black",
//                           padding: "5px 15px 5px 15px",
//                           marginBottom: '5px',
//                           borderRadius: "20px",
//                           display: 'inline-block',
//                           whiteSpace: 'pre-line'
//                         }}>
//                           {item.text}
//                         </span>
//                         {isLastInGroup && (
//                           <small style={{ color: "grey", textAlign: item.from === user.uid ? 'right' : 'left', display: 'block', marginBottom: "10px" }}>
//                             {item.waktu}
//                           </small>
//                         )}
//                       </div>
//                     </React.Fragment>
//                   );
//                 })
//               }



//               <div style={{ height: '100px' }}></div>
//             </div>





//             <div
//               className='overflow-auto'
//               style={{
//                 flex: 1, // Membuat div ini mengambil semua ruang yang tersedia
//                 display: 'flex',
//                 flexDirection: 'column',
//                 justifyContent: 'flex-end' // Agar konten berada di bagian bawah
//               }}
//             >

//               <div
//                 className="d-flex align-items-center justify-content-center" // Menggunakan Flexbox untuk input dan tombol
//                 style={{
//                   padding: '10px',
//                   background: 'white',
//                   position: 'absolute',
//                   bottom: '30px',
//                   width: '100%'
//                 }}
//               >
//                 <textarea
//                   className='form-control me-2' // Menambahkan margin-right untuk memberi ruang antara input dan tombol
//                   type="text"
//                   value={chatText} onChange={(e) => setChatText(e.target.value)}
//                   style={{
//                     flex: 1, // Membuat input mengambil ruang yang tersisa
//                     marginTop: '0px',
//                     height: '40px'
//                   }}
//                 />
//                 <button
//                   className="btn btn-primary"
//                   style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     width: '40px',
//                     height: '40px',
//                   }}
//                   onClick={handleSendChat}
//                 >
//                   <IoIosSend />
//                 </button>
//               </div>
//             </div>
//           </div>

//         </div>
//       )}






//     </div>
//   );
// };

// export default ButtonChat;

export default "Hello World";
