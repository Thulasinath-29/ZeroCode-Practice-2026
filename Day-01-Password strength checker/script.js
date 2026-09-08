// Neumorphism (Soft UI) Real-Time Password Strength Checker

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const registrationForm = document.getElementById("registration-form");
  const formArea = document.getElementById("form-area");
  const usernameInput = document.getElementById("username");
  const usernameHint = document.getElementById("username-hint");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const confirmPasswordHint = document.getElementById("confirm-password-hint");
  const strengthBar = document.getElementById("strength-meter-bar");
  const strengthLabel = document.getElementById("strength-label");
  const registryBtn = document.getElementById("registry-button");
  const successContainer = document.getElementById("success-container");
  const resetSessionBtn = document.getElementById("reset-session-btn");

  const SESSION_REGISTERED_KEY = "has_registered_session";
  const SESSION_ANIMATION_KEY = "animation_played_session";

  // Trigger CSS shake animation for validation error feedback
  const triggerShake = (element) => {
    if (!element) return;
    element.classList.remove("shake-error");
    // Force reflow to restart animation reliably
    void element.offsetWidth;
    element.classList.add("shake-error");
    setTimeout(() => {
      element.classList.remove("shake-error");
    }, 450);
  };

  // Prevent copy, paste, cut, and drag-and-drop on Re-enter Password input
  const preventPasteActions = (e) => {
    e.preventDefault();
    triggerShake(confirmPasswordInput);
    confirmPasswordHint.textContent = "Pasting is disabled. Please type password manually.";
    confirmPasswordHint.className = "field-hint error";
  };

  confirmPasswordInput.addEventListener("paste", preventPasteActions);
  confirmPasswordInput.addEventListener("copy", preventPasteActions);
  confirmPasswordInput.addEventListener("cut", preventPasteActions);
  confirmPasswordInput.addEventListener("drop", preventPasteActions);
  confirmPasswordInput.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Strict Username Validation: Alphabetic letters only (no numbers or spaces)
  const isUsernameValid = (value) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    return /^[A-Za-z]+$/.test(trimmed);
  };

  // Password Strength Evaluation
  // Under 6 chars: Weak (Red)
  // 6 to 10 chars: Medium (Yellow)
  // Over 10 chars AND contains at least one number and one special symbol: Strong (Green)
  const getPasswordStrength = (password) => {
    if (!password || password.length === 0) {
      return { level: "none", label: "", minMediumReached: false };
    }

    const length = password.length;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (length < 6) {
      return { level: "weak", label: "Weak", minMediumReached: false };
    }

    if (length > 10 && hasNumber && hasSpecial) {
      return { level: "strong", label: "Strong", minMediumReached: true };
    }

    // 6 to 10 chars, or over 10 chars without both number and special symbol
    return { level: "medium", label: "Medium", minMediumReached: true };
  };

  // Update UI & Validate Form State
  const updateFormState = () => {
    const usernameVal = usernameInput.value;
    const passwordVal = passwordInput.value;
    const confirmVal = confirmPasswordInput.value;

    // 1. Username status
    const usernameValid = isUsernameValid(usernameVal);
    if (usernameVal.length > 0) {
      if (!usernameValid) {
        usernameInput.classList.add("input-error");
        usernameHint.textContent = "Only letters A-Z allowed (no numbers or spaces)";
        usernameHint.className = "field-hint error";
      } else {
        usernameInput.classList.remove("input-error");
        usernameHint.textContent = "";
        usernameHint.className = "field-hint";
      }
    } else {
      usernameInput.classList.remove("input-error");
      usernameHint.textContent = "";
      usernameHint.className = "field-hint";
    }

    // 2. Password strength meter
    const strength = getPasswordStrength(passwordVal);
    strengthBar.className = "strength-meter-bar";
    strengthLabel.className = "strength-label";

    if (strength.level === "none") {
      strengthBar.style.width = "0%";
      strengthLabel.textContent = "";
      passwordInput.classList.remove("input-error");
    } else {
      strengthBar.style.width = ""; // Use CSS class width
      strengthBar.classList.add(strength.level);
      strengthLabel.classList.add(strength.level);
      strengthLabel.textContent = strength.label;
      if (strength.minMediumReached) {
        passwordInput.classList.remove("input-error");
      }
    }

    // 3. Confirm password status (Error if not matching)
    const passwordsMatch = confirmVal.length > 0 && confirmVal === passwordVal;
    if (confirmVal.length > 0) {
      if (!passwordsMatch) {
        confirmPasswordInput.classList.add("input-error");
        confirmPasswordHint.textContent = "Passwords do not match";
        confirmPasswordHint.className = "field-hint error";
      } else {
        confirmPasswordInput.classList.remove("input-error");
        confirmPasswordHint.textContent = "Passwords match";
        confirmPasswordHint.className = "field-hint success";
      }
    } else {
      confirmPasswordInput.classList.remove("input-error");
      confirmPasswordHint.textContent = "";
      confirmPasswordHint.className = "field-hint";
    }

    // 4. Registry button visibility
    // MUST remain completely hidden (display: none) until:
    // - Username is valid
    // - Password is at least Yellow/Medium
    // - Re-enter Password matches
    const canRegister = usernameValid && strength.minMediumReached && passwordsMatch;

    if (canRegister) {
      registryBtn.style.display = "block";
    } else {
      registryBtn.style.display = "none";
    }
  };

  // Immediate visual feedback on invalid character typing in Username
  usernameInput.addEventListener("keydown", (e) => {
    // Allow navigation and modification keys (Backspace, Tab, Arrows, Delete, Enter, Ctrl/Cmd shortcuts)
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
      return;
    }
    // Reject numbers, spaces, and symbols with immediate shake feedback
    if (!/^[A-Za-z]$/.test(e.key)) {
      triggerShake(usernameInput);
      usernameInput.classList.add("input-error");
      usernameHint.textContent = "Only letters A-Z allowed (no numbers or spaces)";
      usernameHint.className = "field-hint error";
    }
  });

  let previousUsernameVal = "";
  usernameInput.addEventListener("input", () => {
    const currentVal = usernameInput.value;
    if (currentVal.length > 0 && !isUsernameValid(currentVal)) {
      if (currentVal !== previousUsernameVal) {
        triggerShake(usernameInput);
      }
    }
    previousUsernameVal = currentVal;
    updateFormState();
  });

  // Password input handling
  passwordInput.addEventListener("input", () => {
    updateFormState();
    // Re-check confirm password match if already entered
    if (confirmPasswordInput.value.length > 0) {
      if (confirmPasswordInput.value !== passwordInput.value) {
        confirmPasswordInput.classList.add("input-error");
        confirmPasswordHint.textContent = "Passwords do not match";
        confirmPasswordHint.className = "field-hint error";
      }
    }
  });

  passwordInput.addEventListener("blur", () => {
    if (passwordInput.value.length > 0 && passwordInput.value.length < 6) {
      passwordInput.classList.add("input-error");
      triggerShake(passwordInput);
    }
  });

  // Re-enter Password input handling with immediate mismatch feedback
  let previousConfirmVal = "";
  confirmPasswordInput.addEventListener("input", () => {
    const currentConfirm = confirmPasswordInput.value;
    const currentPassword = passwordInput.value;

    if (currentConfirm.length > 0) {
      // If user inputs a character that causes immediate mismatch with password prefix
      if (!currentPassword.startsWith(currentConfirm) || currentConfirm.length > currentPassword.length) {
        triggerShake(confirmPasswordInput);
      }
    }
    previousConfirmVal = currentConfirm;
    updateFormState();
  });

  confirmPasswordInput.addEventListener("blur", () => {
    const currentConfirm = confirmPasswordInput.value;
    const currentPassword = passwordInput.value;
    if (currentConfirm.length > 0 && currentConfirm !== currentPassword) {
      confirmPasswordInput.classList.add("input-error");
      confirmPasswordHint.textContent = "Passwords do not match";
      confirmPasswordHint.className = "field-hint error";
      triggerShake(confirmPasswordInput);
    }
  });

  // Show Success State
  const showSuccessState = (forceStatic = false) => {
    formArea.style.display = "none";
    successContainer.style.display = "flex";

    const hasAnimationPlayed = sessionStorage.getItem(SESSION_ANIMATION_KEY) === "true";

    if (!hasAnimationPlayed && !forceStatic) {
      // Trigger CSS animation once per session
      successContainer.classList.remove("static-display");
      successContainer.classList.add("animate-popup");
      sessionStorage.setItem(SESSION_ANIMATION_KEY, "true");
    } else {
      // Static display if animation already played
      successContainer.classList.remove("animate-popup");
      successContainer.classList.add("static-display");
    }

    sessionStorage.setItem(SESSION_REGISTERED_KEY, "true");
  };

  // Handle Form Submission with shake validation for invalid fields
  registrationForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const usernameValid = isUsernameValid(usernameInput.value);
    const strength = getPasswordStrength(passwordInput.value);
    const passwordsMatch =
      confirmPasswordInput.value.length > 0 &&
      confirmPasswordInput.value === passwordInput.value;

    let hasValidationError = false;

    // Validate Username on submit attempt
    if (!usernameValid) {
      usernameInput.classList.add("input-error");
      usernameHint.textContent = "Only letters A-Z allowed (no numbers or spaces)";
      usernameHint.className = "field-hint error";
      triggerShake(usernameInput);
      hasValidationError = true;
    }

    // Validate Password strength on submit attempt
    if (!strength.minMediumReached) {
      passwordInput.classList.add("input-error");
      triggerShake(passwordInput);
      hasValidationError = true;
    }

    // Validate Re-enter Password on submit attempt
    if (!passwordsMatch) {
      confirmPasswordInput.classList.add("input-error");
      confirmPasswordHint.textContent = "Passwords do not match";
      confirmPasswordHint.className = "field-hint error";
      triggerShake(confirmPasswordInput);
      hasValidationError = true;
    }

    if (!hasValidationError && usernameValid && strength.minMediumReached && passwordsMatch) {
      showSuccessState(false);
    }
  });

  // Handle Reset / Register Another Member
  resetSessionBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_REGISTERED_KEY);
    registrationForm.reset();
    usernameInput.classList.remove("input-error", "shake-error");
    passwordInput.classList.remove("input-error", "shake-error");
    confirmPasswordInput.classList.remove("input-error", "shake-error");
    strengthBar.className = "strength-meter-bar";
    strengthBar.style.width = "0%";
    strengthLabel.textContent = "";
    usernameHint.textContent = "";
    confirmPasswordHint.textContent = "";
    registryBtn.style.display = "none";
    successContainer.style.display = "none";
    formArea.style.display = "block";
  });

  // Check if user was already registered in current session
  if (sessionStorage.getItem(SESSION_REGISTERED_KEY) === "true") {
    showSuccessState(true);
  } else {
    // Initial check
    updateFormState();
  }
});
