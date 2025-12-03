import { signUp } from "./auth";



export const showPage = (pageId: string) => {
	const app = document.getElementById("app") as HTMLElement;

  // Collect all screen elements
  const screens = [
	app,
	document.getElementById("register"),
	// Add more screens here if needed
  ].filter(Boolean) as HTMLElement[]; // filter out nulls

  // Hide all screens
  screens.forEach(screen => {
	screen.style.display = "none";
  });

  // Show the requested page
  const target = document.getElementById(pageId);
  if (target) {
	target.style.display = "block";
  } else {
	console.warn(`No page found with id: ${pageId}`);
  }
};


export const  handleRegister = async (event: PointerEvent, errorP: HTMLParagraphElement, button: HTMLButtonElement) => {
	event.preventDefault();
	console.log("button clicked")

	const email = (document.getElementById("email") as HTMLInputElement).value;
	const password1 = (document.getElementById("password1") as HTMLInputElement).value;
	const password2 = (document.getElementById("password2") as HTMLInputElement).value;
	const name = (document.getElementById("name") as HTMLInputElement).value;

	if (!email || !password1 || !password2) {
		errorP.innerText = "Please fill out all fields";
		return;
	}

	if (password1 !== password2) {
		errorP.innerText = "Passwords do not match";
		return;
	}

	if (name.trim() == "") {
		errorP.innerText = "Enter a valid name"
		return
	}

	document.body.style.cursor = "wait"
	button.disabled = true

	const { error } = await signUp(email, password1,  name);
	if (error) {
		errorP.innerText = error;
		return;
	} else {
		const confirmEmailEl = document.getElementById("confirmEmail");

		if (confirmEmailEl) {
			confirmEmailEl.style.display = "block";
		}
	}

	errorP.innerText = ""
	document.body.style.cursor = "default"

	// Successful sign-up: data.user might be null until email confirmed
	// Supabase onAuthStateChange will trigger and handle UI

}

