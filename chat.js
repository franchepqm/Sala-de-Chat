import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, getDoc, doc, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  const chatForm = document.getElementById("chat-form");
  const messageInput = document.getElementById("message-input");
  const chatMessages = document.getElementById("chat-messages");
  const sendButton = document.getElementById("send-button");
  const imagenPerfil = document.getElementById("imagenPerfil");

  sendButton.addEventListener("click", async function () {
    const message = messageInput.value.trim();
  
    if (message !== "") {
      try {
        let imgPerfilUrl = "";
  
        if (user) {
          const pacienteDocRef = doc(db, "pacientes", user.email);
          const pacienteDoc = await getDoc(pacienteDocRef);
  
          if (pacienteDoc.exists()) {
            const pacienteData = pacienteDoc.data();
            if (pacienteData && pacienteData.imagenUrl) {
              imgPerfilUrl = pacienteData.imagenUrl;
            }
          }
        }
  
        await addDoc(collection(db, 'messages'), {
          message: message,
          timestamp: new Date(),
          usuario: user ? user.email : null,
          ImgPerfil: imgPerfilUrl, 
        });
  
        console.log("Mensaje enviado correctamente con la imagen de perfil");
      } catch (error) {
        console.error("Error al enviar el mensaje:", error.message);
      }
  
      messageInput.value = "";
    }
  });

  onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (querySnapshot) => {
    chatMessages.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const message = doc.data();
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message-container");
        

        if (message.ImgPerfil) {
            const imgPerfil = document.createElement("img");
            imgPerfil.src = message.ImgPerfil; imgPerfil.alt = "Imagen de perfil"; imgPerfil.classList.add("perfil-icon");
            messageDiv.appendChild(imgPerfil);
        }

        const contentContainer = document.createElement("div");
        contentContainer.classList.add("content-container");

        const usuarioDiv = document.createElement("div");
        usuarioDiv.textContent = `${message.usuario ? message.usuario : ''}`;
        contentContainer.appendChild(usuarioDiv);

        const mensajeDiv = document.createElement("div");
        mensajeDiv.textContent = message.message;
        mensajeDiv.classList.add("message-content");
        contentContainer.appendChild(mensajeDiv);

        messageDiv.appendChild(contentContainer);

        chatMessages.appendChild(messageDiv);

        messageDiv.addEventListener("click", function() {
          const modal = document.querySelector(".modal");
          modal.style.display = "block";
      
          const userName = document.querySelector("#userName");
          userName.textContent = message.usuario;
      
          const userIcon = document.querySelector("#userIcon");
          userIcon.src = message.ImgPerfil;
      
          const sendButton = document.querySelector("#sendButton");
          sendButton.addEventListener("click", function() {
              const userInput = document.querySelector("#userInput").value;
              console.log(`Mensaje privado enviado a ${message.usuario}: ${userInput}`);
              modal.style.display = "none";
          });

        
      });
    });
  });
  if (user) {
    console.log("Email del usuario:", user.email);

    const pacienteDocRef = doc(db, "pacientes", user.email);
    getDoc(pacienteDocRef).then((doc) => {
      if (doc.exists()) {
        const pacienteData = doc.data();
        if (pacienteData && pacienteData.imagenUrl) {
          console.log("URL de la imagen de perfil:", pacienteData.imagenUrl);
          
          imagenPerfil.src = pacienteData.imagenUrl;
        }
      } else {
        console.log("El usuario no tiene datos en la colección 'pacientes'");
      }
    }).catch((error) => {
      console.error("Error al obtener datos del usuario:", error.message);
    });
  }
});
const sendButton = document.getElementById("sendButton");

sendButton.addEventListener("click", async function() {

    const userInput = document.getElementById("userInput").value.trim();

    const userEmail = document.getElementById("userName").textContent;

    try {
        if (auth.currentUser) {
            const currentUserEmail = auth.currentUser.email;

            const pacienteDocRef = doc(db, "pacientes", userEmail);
            const pacienteDocSnap = await getDoc(pacienteDocRef);

            if (pacienteDocSnap.exists()) {

                const pacienteData = pacienteDocSnap.data();
                const mensajesPrivados = pacienteData.mensajesPrivados || [];


                mensajesPrivados.push({
                    remitente: currentUserEmail,
                    mensaje: userInput,
                    timestamp: new Date()
                });

                await updateDoc(pacienteDocRef, { mensajesPrivados });

                console.log("Mensaje privado enviado correctamente.");
            } else {
                console.error("El documento del paciente no existe.");
            }
        } else {
            console.error("Usuario no autenticado.");
        }
    } catch (error) {
        console.error("Error al enviar el mensaje privado:", error);
    }
});
const reportButton = document.getElementById("reportButton");

reportButton.addEventListener("click", async function() {
    const userEmail = document.getElementById("userName").textContent;

    try {
        const pacienteDocRef = doc(db, "pacientes", userEmail);
        const pacienteDocSnap = await getDoc(pacienteDocRef);

        if (pacienteDocSnap.exists()) {

            const pacienteData = pacienteDocSnap.data();
            let reportesCount = pacienteData.Reportes || 0;
            reportesCount++;


            await updateDoc(pacienteDocRef, { Reportes: reportesCount });
        } else {

            await setDoc(pacienteDocRef, { Reportes: 1 });
        }

        console.log(`Reporte enviado exitosamente para ${userEmail}`);
    } catch (error) {
        console.error("Error al enviar el reporte:", error.message);
    }
});
