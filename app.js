// Firebase configuration (replace with your own project's credentials)
const firebaseConfig = {
    apiKey: "AIzaSyDYJfmmxGa5ZbZ5F78IPO46T_cjcHx-nd8",
    authDomain: "auth-basic-76158.firebaseapp.com",
    databaseURL: "https://auth-basic-76158-default-rtdb.firebaseio.com",
    projectId: "auth-basic-76158",
    storageBucket: "auth-basic-76158.firebasestorage.app",
    messagingSenderId: "354233074186",
    appId: "1:354233074186:web:ff15ac8e394f36589955f3"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // DOM Elements
  const authSection = document.getElementById("auth-section");
  const bioAuthBtn = document.getElementById("bio-auth-btn");
  const authMessage = document.getElementById("auth-message");
  const appSection = document.getElementById("app-section");
  
  const recipeForm = document.getElementById("recipe-form");
  const recipeList = document.getElementById("recipe-list");
  const feedback = document.getElementById("feedback");
  const filterInput = document.getElementById("filter-input");
  
  let recipes = [];
  
  /* -----------------------------
     Biometric Authentication
  ------------------------------ */
  
  // ===== Biometric Registration (WebAuthn) =====
  bioRegisterBtn.addEventListener("click", async () => {
    const publicKeyCredentialCreationOptions = {
      challenge: Uint8Array.from("randomChallengeForReg", c => c.charCodeAt(0)),
      rp: {
        name: "recipe saver App",
        id: window.location.hostname  // Use 'localhost' during development if needed.
      },
      user: {
        id: Uint8Array.from("uniqueUserId", c => c.charCodeAt(0)),
        name: "user@example.com",
        displayName: "User"
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred"
      },
      timeout: 60000,
      attestation: "none"
    };

    try {
      const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
      console.log("Biometric registration credential:", credential);
      bioFeedback.textContent = "Biometric registration successful!";
      onAuthenticated("demoUser");
    } catch (error) {
      console.error("Biometric registration error:", error);
      bioFeedback.textContent = "Biometric registration failed.";
    }
  });

  bioAuthBtn.addEventListener("click", biometricLogin);
  
  
  function loadRecipes() {
    db.collection("recipes").onSnapshot((snapshot) => {
      recipes = [];
      snapshot.forEach((doc) => {
        let data = doc.data();
        data.id = doc.id;
        recipes.push(data);
      });
      renderRecipes(recipes);
    });
  }
  
  // Render the list of recipes
  function renderRecipes(recipesToRender) {
    recipeList.innerHTML = "";
    recipesToRender.forEach((recipe) => {
      const li = document.createElement("li");
      li.classList.add("recipe-item");
      if (recipe.favorite) {
        li.classList.add("favorite");
      }
      li.innerHTML = `
        <h3>${recipe.title}</h3>
        <p><strong>Ingredients:</strong> ${recipe.ingredients}</p>
        <p><strong>Meal Type:</strong> ${recipe.mealType}</p>
        <button class="edit-btn" data-id="${recipe.id}">Edit</button>
        <button class="delete-btn" data-id="${recipe.id}">Delete</button>
      `;
      recipeList.appendChild(li);
    });
  }
  

  recipeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const recipeId = document.getElementById("recipe-id").value;
    const title = document.getElementById("title").value;
    const ingredients = document.getElementById("ingredients").value;
    const mealType = document.getElementById("mealType").value;
    const favorite = document.getElementById("favorite").checked;
  
    const recipeData = { title, ingredients, mealType, favorite };
  
    try {
      if (recipeId) {
        // Update existing recipe
        await db.collection("recipes").doc(recipeId).update(recipeData);
        feedback.textContent = "Recipe updated successfully!";
      } else {
        // Add a new recipe
        await db.collection("recipes").add(recipeData);
        feedback.textContent = "Recipe added successfully!";
      }
      recipeForm.reset();
      document.getElementById("recipe-id").value = "";
      setTimeout(() => (feedback.textContent = ""), 3000);
    } catch (error) {
      feedback.textContent = "Error saving recipe.";
      console.error(error);
    }
  });
  
  // Edit recipe functionality
  recipeList.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn")) {
      const id = e.target.getAttribute("data-id");
      const recipe = recipes.find((r) => r.id === id);
      if (recipe) {
        document.getElementById("recipe-id").value = recipe.id;
        document.getElementById("title").value = recipe.title;
        document.getElementById("ingredients").value = recipe.ingredients;
        document.getElementById("mealType").value = recipe.mealType;
        document.getElementById("favorite").checked = recipe.favorite;
        feedback.textContent = "Editing recipe...";
      }
    }
  });
  
  // Delete recipe functionality
  recipeList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.getAttribute("data-id");
      try {
        await db.collection("recipes").doc(id).delete();
        feedback.textContent = "Recipe deleted successfully!";
        setTimeout(() => (feedback.textContent = ""), 3000);
      } catch (error) {
        feedback.textContent = "Error deleting recipe.";
        console.error(error);
      }
    }
  });
  
  // Filter recipes based on user input
  filterInput.addEventListener("input", () => {
    const query = filterInput.value.toLowerCase();
    const filteredRecipes = recipes.filter((recipe) => {
      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.toLowerCase().includes(query) ||
        recipe.mealType.toLowerCase().includes(query)
      );
    });
    renderRecipes(filteredRecipes);
  });
  

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }