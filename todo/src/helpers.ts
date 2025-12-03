import { resetPassword, savePassword, signIn, signOut, signUp, updateUser } from "./auth";
const message = document.getElementById("message");
import type { User } from '@supabase/supabase-js';



export const showPage = (pageId: string) => {
	const app = document.getElementById("app") as HTMLElement;

  // Collect all screen elements
  const screens = [
		app,
		document.getElementById("signUp"),
		document.getElementById("signIn"),
		document.getElementById("updateUser"),
		document.getElementById("resetPasswordForm"),
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

export const updateUI = (session: any) => {  
	if (session?.user) {
		showPage('app')
		const greeting = document.getElementById("greeting") as HTMLParagraphElement 
		greeting.innerText = `Welcome back, ${session.user.user_metadata.name}!`
	} else {
		showPage("signIn")
	} 
}

export const  handleSignUp = async (event: PointerEvent,  button: HTMLButtonElement) => {
	event.preventDefault();

	const email = (document.getElementById("email") as HTMLInputElement).value;
	const password1 = (document.getElementById("password1") as HTMLInputElement).value;
	const password2 = (document.getElementById("password2") as HTMLInputElement).value;
	const name = (document.getElementById("name") as HTMLInputElement).value;
	const errorP = document.getElementById("error") as HTMLParagraphElement;


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
		if (message) {
			message.style.display = "block";
			message.innerText = "Your account was successfully created! Confirm your email account to be able to continue! "
		}
	}

	errorP.innerText = ""
	document.body.style.cursor = "default"

	// Successful sign-up: data.user might be null until email confirmed
	// Supabase onAuthStateChange will trigger and handle UI

}

export const  handleSignIn = async (event: PointerEvent, button: HTMLButtonElement) => {
	event.preventDefault();

	const email = (document.getElementById("signInEmail") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;
	const errorP = document.getElementById("signInError") as HTMLParagraphElement;


	if (!email || !password) {
		errorP.innerText = "Please fill out all fields";
		return;
	}

	document.body.style.cursor = "wait"
	button.disabled = true

	const { error } = await signIn(email, password);
	if (error) {
		errorP.innerText = error;
		return;
	} else {
		if (message) {
			message.style.display = "block";
			message.innerText = "You are logged in successfully! We wish you productive day!"
		}
	}

	errorP.innerText = ""
	document.body.style.cursor = "default"
	showPage("app")
}

export const  handleUpdateUserForm = async (event: PointerEvent, currentData: User) => {
	event.preventDefault();

	const email = document.getElementById("updateEmail") as HTMLInputElement;
	const name = document.getElementById("updateName") as HTMLInputElement;

	email.value = currentData.email ?? ''
	name.value = currentData.user_metadata.name

	showPage("updateUser")

}

export const  handleSaveUser = async (event: PointerEvent, button: HTMLButtonElement) => {
	event.preventDefault();

	const email = (document.getElementById("updateEmail") as HTMLInputElement).value;
	const name = (document.getElementById("updateName") as HTMLInputElement).value;
	const errorP = document.getElementById("updateUserError") as HTMLParagraphElement;


	if (!email || !name) {
		errorP.innerText = "Please fill out all fields";
		return;
	}

	document.body.style.cursor = "wait"
	button.disabled = true

	const { error } = await updateUser({email, name});
	if (error) {
		errorP.innerText = error;
		return;
	} else {
		if (message) {
			message.style.display = "block";
			message.innerText = "Your account was updated successfully!"
		}
	}

	errorP.innerText = ""
	document.body.style.cursor = "default"
	showPage("app")
}

export const handleSendLink = async (button: HTMLButtonElement, email: string) => {
	document.body.style.cursor = "wait"
	button.disabled = true

	if (message) {
		message.style.display = "block";
		message.innerText = "We have sent you an email link to reset your password. Follow the link and instructions we give you."
	}

	const { error } = await resetPassword(email);
	if (error) {
		console.error(error);
		return;
	}

	document.body.style.cursor = "default"
}

export const handleResetPassword = async (button: HTMLButtonElement) => {
  const hash = window.location.hash;
  if (hash.includes('access_token') && hash.includes('refresh_token')) {
		const password1 = (document.getElementById("password1Reset") as HTMLInputElement).value;
		const password2 = (document.getElementById("password2Reset") as HTMLInputElement).value;
		const errorP = document.getElementById("errorResetPassword") as HTMLParagraphElement;


		if ( !password1 || !password2) {
			errorP.innerText = "Please fill out all fields";
			return;
		}

		if (password1 !== password2) {
			errorP.innerText = "Passwords do not match";
			return;
		}

		document.body.style.cursor = "wait"
		button.disabled = true

    await savePassword(password1);

		window.history.replaceState(null, '', window.location.pathname);
		showPage("app")

    if (message) message.innerText = "Password updated successfully";
  } else {
    if (message) message.innerText = "Invalid reset password link.";
  }
};

export const handleSignOut = async () => {
	signOut()

	if (message) message.innerText = 'You have been successfully signed out!'
}

