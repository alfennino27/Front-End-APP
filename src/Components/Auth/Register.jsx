// import React, { useState } from 'react';
// import { Col, Container, Modal, Button, Dropdown, Toast } from 'react-bootstrap';
// import './auth.css';
// import { FormGroup, FormControlLabel, Checkbox } from '@mui/material';
// import { Link } from 'react-router-dom';
// import gambar from '../../assets/images/gambar.jpg';
// import klftoast from '../../assets/images/klflogo.png';
// import { FcGoogle } from 'react-icons/fc';
// import db from '../../Config/Firebase';
// import { auth } from '../../Config/Firebase';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { collection, setDoc, doc } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// const Register = () => {
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [rePassword, setRePassword] = useState('');
//   const [fileToUpload, setFileToUpload] = useState(null);
//   const storage = getStorage();
//   const [showToast, setShowToast] = useState(false);
//   const isMobile = window.innerWidth <= 768;
//   const [toastMessage, setToastMessage] = useState('');

//   const handleRegister = async () => {
//     console.log(username, password);
//     try {
//       if (password.length < 6) {
//         //alert('Password must be at least 6 characters long');
//         setToastMessage('Password must be at least 6 characters long');
//         setShowToast(true);
//         setTimeout(() => setShowToast(false), 3000);
//         return; // Menggunakan return agar proses berhenti jika password tidak memenuhi syarat
//       }

//       if (password !== rePassword) {
//         //alert('Passwords do not match');
//         setToastMessage('Passwords do not match');
//         setShowToast(true);
//         setTimeout(() => setShowToast(false), 3000);
//         return; // Menggunakan return agar proses berhenti jika password tidak sama
//       }

//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       console.log('berhasil', userCredential.user.uid);

//       let url = null;
//       if (fileToUpload) {
//         const storageRef = ref(storage, `images/${fileToUpload.name}`);
//         await uploadBytes(storageRef, fileToUpload);
//         url = await getDownloadURL(storageRef);
//       }

//       // Simpan data pengguna ke Firestore
//       const userDocRef = doc(collection(db, 'Users'), userCredential.user.uid);
//       await setDoc(userDocRef, {
//         name: username,
//         uid: userCredential.user.uid,
//         profilePicture: url,
//       });

//       console.log('User created:', email);
//       // alert('Register Berhasil, Silahkan Login...');
//       setToastMessage('Register Success, Please Login...');
//       setShowToast(true);
//       setTimeout(() => setShowToast(false), 3000);
//       window.location.replace('/login');
//     } catch (error) {
//       //alert('Error creating user:', error.message);
//       setToastMessage('Error creating user');
//       setShowToast(true);
//       setTimeout(() => setShowToast(false), 3000);
//     }
//   };

//   return (
//     <>
//       <div className="main ">
//         <div className="registerForm border shadow p-5">
//           <h4 className="mb-3 text-center">Daftar</h4>

//           <div className="mb-3 ">
//             <label>Username</label>
//             <input type="text" className="form-control" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
//           </div>
//           <div className="mb-3 ">
//             <label>Email address</label>
//             <input type="email" className="form-control" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
//           </div>
//           <div className="mb-3 ">
//             <label>Profile Picture</label>
//             <input type="file" className="form-control" onChange={(e) => { const files = e.target.files; setFileToUpload(files[0]); }} />
//           </div>
//           <div className="mb-3 ">
//             <label>Password</label>
//             <input type="password" className="form-control" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
//           </div>
//           <div className="mb-3">
//             <label>Re-Password</label>
//             <input type="password" className="form-control" placeholder="Re-enter password" value={rePassword} onChange={(e) => setRePassword(e.target.value)} />
//           </div>

//           {/* <button className="btn-login mt-3" style={{ background: "#0d6efd" }} onClick={handleRegister}>Sign Up</button> */}
//         </div>
//       </div>

//       <div
//         style={{
//           position: 'fixed',
//           padding: '0.5rem',
//           zIndex: '3',
//           ...(isMobile ? { top: 130, left: '50%', transform: 'translateX(-50%)' } : { bottom: 30, right: 30 }),
//         }}
//       >
//         <Toast show={showToast} onClose={() => setShowToast(false)}>
//           <Toast.Header>
//             <img src={klftoast} className="rounded me-2" alt="..." style={{ width: "20px", height: "auto" }} />
//             <strong className="me-auto">KLF Project Manager</strong>
//             <small>Just now...</small>
//           </Toast.Header>
//           <Toast.Body>{toastMessage}</Toast.Body>
//         </Toast>
//       </div>
//     </>
//   );
// };

// export default Register;

export default "Hello World";
