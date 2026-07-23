import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  UserPlus,
  CreditCard,
  CloudLightning,
  Coins,
  Globe,
} from "lucide-react";
import {
  db,
  auth,
  isRealFirebase,
  handleFirestoreError,
  OperationType,
} from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserAccount } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState<string>("South Africa");
  const [selectedTier, setSelectedTier] = useState<
    "free" | "starter" | "professional" | "business" | "enterprise"
  >("free");
  const [loading, setLoading] = useState(false);
  const [errorMess, setErrorMess] = useState<string | null>(null);
  const [successMess, setSuccessMess] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showSimulatedGoogleChooser, setShowSimulatedGoogleChooser] =
    useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  const hasClaimedFree = React.useMemo(() => {
    return (
      typeof window !== "undefined" &&
      localStorage.getItem("gmi_free_tier_claimed") === "true"
    );
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialMode === "signup") {
        setIsSignUp(true);
      } else {
        setIsSignUp(false);
      }
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("gmi_free_tier_claimed") === "true"
      ) {
        setSelectedTier("starter");
      } else {
        setSelectedTier("free");
      }
      setIsForgotPassword(false);
      setShowSimulatedGoogleChooser(false);
      setCustomGoogleEmail("");
      setErrorMess(null);
      setSuccessMess(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMess(
        "Please fill in your Email Address to receive the password reset link.",
      );
      return;
    }
    setErrorMess(null);
    setSuccessMess(null);
    setLoading(true);
    try {
      if (isRealFirebase) {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMess(
          `We've sent a real password reset link to ${email.trim()}. Please secure your inbox shortly!`,
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccessMess(
          `[Simulation Mode] A simulated reset link has been dispatched to ${email.trim()}. On production, this sends an authentic Firebase Auth automated credential recovery message.`,
        );
      }
    } catch (err: any) {
      setErrorMess(err.message || "Failed to dispatch password reset message.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMess("Please fill in all email and password fields.");
      return;
    }
    setErrorMess(null);
    setLoading(true);

    const lowerEmail = email.toLowerCase().trim();
    const isSpecialEmail =
      lowerEmail === "info@seolab.co.za" ||
      lowerEmail === "brigittalombard09@gmail.com";

    // Stretch "123" password under real Firebase backend to bypass minimum 6-character validation rules seamlessly.
    let processedPassword = password;
    if (isSpecialEmail && password === "123") {
      processedPassword = "123_safeguard_secure_seolab";
    }

    try {
      if (isRealFirebase) {
        // REAL FIREBASE LOGIC
        if (isSignUp) {
          if (
            selectedTier === "free" &&
            !isSpecialEmail &&
            localStorage.getItem("gmi_free_tier_claimed") === "true"
          ) {
            throw new Error(
              "You have already claimed the free tier trial on this device. Please select another tier to proceed.",
            );
          }

          let userCredential;
          try {
            userCredential = await createUserWithEmailAndPassword(
              auth,
              email,
              processedPassword,
            );
          } catch (signUpErr: any) {
            if (isSpecialEmail) {
              console.warn(
                "Full Auth bypass engaged for admin on signup.",
                signUpErr,
              );
              localStorage.setItem("gmi_current_sim_email", lowerEmail);
              const bypassProfile: UserAccount = {
                uid: "mock-admin-uid-" + Date.now(),
                email: lowerEmail,
                paymentTier: "enterprise",
                invoiceCredits: 999999,
                amountPaid: 0,
                invoicesCount: 0,
                createdAt: new Date().toISOString(),
              };
              let savedUsersCheck = JSON.parse(
                localStorage.getItem("gmi_simulated_db_users") || "{}",
              );
              savedUsersCheck[lowerEmail] = bypassProfile;
              localStorage.setItem(
                "gmi_simulated_db_users",
                JSON.stringify(savedUsersCheck),
              );
              onAuthSuccess(bypassProfile);
              return; // Exit out since we successfully bypassed
            }
            throw signUpErr;
          }
          const fUser = userCredential.user;

          let initialCredits = isSpecialEmail ? 999999 : 10;
          let amtPaid = 0;
          let paymentTier = isSpecialEmail ? "enterprise" : selectedTier;
          let trialActive = false;
          let trialStartDate = "";
          let aiCreditsRemaining = isSpecialEmail ? 999999 : 3;
          let aiCreditsTotal = isSpecialEmail ? 999999 : 3;
          let isPro = isSpecialEmail;

          if (!isSpecialEmail) {
            isPro = paymentTier !== "free";
            if (selectedTier === "enterprise") {
              initialCredits = 999999;
              amtPaid = 299.0;
              aiCreditsRemaining = 999999;
              aiCreditsTotal = 999999;
            } else if (selectedTier === "business") {
              initialCredits = 999999;
              amtPaid = 79.99;
              aiCreditsRemaining = 999999;
              aiCreditsTotal = 999999;
            } else if (selectedTier === "professional") {
              initialCredits = 999999;
              amtPaid = 34.99;
              aiCreditsRemaining = 2500;
              aiCreditsTotal = 2500;
            } else if (selectedTier === "starter") {
              initialCredits = 100;
              amtPaid = 14.99;
              aiCreditsRemaining = 300;
              aiCreditsTotal = 300;
            } else if (selectedTier === "free") {
              initialCredits = 3;
              amtPaid = 0;
              aiCreditsRemaining = 3;
              aiCreditsTotal = 3;
              trialActive = true;
              trialStartDate = new Date().toISOString();
            }
          }

          if (paymentTier === "free") {
            localStorage.setItem("gmi_free_tier_claimed", "true");
          }

          const userProfile: UserAccount = {
            uid: fUser.uid,
            email: fUser.email || email,
            paymentTier: paymentTier,
            invoiceCredits: initialCredits,
            amountPaid: amtPaid,
            invoicesCount: 0,
            createdAt: new Date().toISOString(),
            trialActive,
            trialStartDate,
            country,
            isPro,
            aiCreditsRemaining,
            aiCreditsTotal,
          };

          const userRef = doc(db, "users", fUser.uid);
          try {
            await setDoc(userRef, userProfile);
          } catch (fireErr) {
            console.warn(
              "Firestore setDoc failed during signup. Proceeding with auth...",
              fireErr,
            );
          }

          onAuthSuccess(userProfile);
        } else {
          // login
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              email,
              processedPassword,
            );
            const fUser = userCredential.user;
            const userRef = doc(db, "users", fUser.uid);

            let userProfile: UserAccount;
            try {
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                userProfile = userSnap.data() as UserAccount;
                if (
                  isSpecialEmail &&
                  userProfile.paymentTier !== "enterprise"
                ) {
                  userProfile.paymentTier = "enterprise";
                  userProfile.invoiceCredits = 999999;
                  await setDoc(userRef, userProfile);
                }
              } else {
                // Create default profile if somehow missing
                userProfile = {
                  uid: fUser.uid,
                  email: fUser.email || email,
                  paymentTier: isSpecialEmail ? "enterprise" : "free",
                  invoiceCredits: isSpecialEmail ? 999999 : 3,
                  amountPaid: 0,
                  invoicesCount: 0,
                  createdAt: new Date().toISOString(),
                };
                await setDoc(userRef, userProfile);
              }
            } catch (fireErr) {
              console.warn(
                "Firestore getDoc/setDoc failed during login. Proceeding with fallback user profile.",
                fireErr,
              );
              userProfile = {
                uid: fUser.uid,
                email: fUser.email || email,
                paymentTier: isSpecialEmail ? "enterprise" : "free",
                invoiceCredits: isSpecialEmail ? 999999 : 3,
                amountPaid: 0,
                invoicesCount: 0,
                createdAt: new Date().toISOString(),
              };
            }
            onAuthSuccess(userProfile);
          } catch (signErr: any) {
            // Self-repairing premium access: If login fails for the special user because they don't exist yet,
            // register them on-the-fly so they get immediate access seamlessly.
            if (isSpecialEmail) {
              try {
                const userCredential = await createUserWithEmailAndPassword(
                  auth,
                  email,
                  processedPassword,
                );
                const fUser = userCredential.user;
                const userProfile: UserAccount = {
                  uid: fUser.uid,
                  email: fUser.email || email,
                  paymentTier: "enterprise",
                  invoiceCredits: 999999,
                  amountPaid: 0,
                  invoicesCount: 0,
                  createdAt: new Date().toISOString(),
                };
                const userRef = doc(db, "users", fUser.uid);
                try {
                  await setDoc(userRef, userProfile);
                } catch (fireErr) {
                  console.warn(
                    "Firestore setDoc failed during special user registration. Proceeding...",
                    fireErr,
                  );
                }
                onAuthSuccess(userProfile);
              } catch (regErr) {
                console.warn("Full Auth bypass engaged for admin.", regErr);
                // Force simulation bypass for special emails if Firebase fully rejects them
                localStorage.setItem("gmi_current_sim_email", lowerEmail);
                const bypassProfile: UserAccount = {
                  uid: "mock-admin-uid-" + Date.now(),
                  email: lowerEmail,
                  paymentTier: "enterprise",
                  invoiceCredits: 999999,
                  amountPaid: 0,
                  invoicesCount: 0,
                  createdAt: new Date().toISOString(),
                };
                let savedUsersCheck = JSON.parse(
                  localStorage.getItem("gmi_simulated_db_users") || "{}",
                );
                savedUsersCheck[lowerEmail] = bypassProfile;
                localStorage.setItem(
                  "gmi_simulated_db_users",
                  JSON.stringify(savedUsersCheck),
                );
                onAuthSuccess(bypassProfile);
              }
            } else {
              throw signErr;
            }
          }
        }
      } else {
        // SIMULATION LOGIC (FOR PREVIEW ENV IN CLIENT WITHOUT VALID CREDENTIALS)
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate networking lag

        let savedUsersCheck = JSON.parse(
          localStorage.getItem("gmi_simulated_db_users") || "{}",
        );

        // Seed the premium accounts into mock database to guarantee standard password login with "123" instantly
        if (isSpecialEmail && !savedUsersCheck[lowerEmail]) {
          savedUsersCheck[lowerEmail] = {
            uid:
              "sim_special_" +
              (lowerEmail === "info@seolab.co.za" ? "seolab" : "brigitta"),
            email: lowerEmail,
            paymentTier: "enterprise",
            invoiceCredits: 999999,
            amountPaid: 0,
            invoicesCount: 15,
            createdAt: new Date().toISOString(),
            mockPassword: "123",
          };
          localStorage.setItem(
            "gmi_simulated_db_users",
            JSON.stringify(savedUsersCheck),
          );
        }

        if (isSignUp) {
          if (savedUsersCheck[lowerEmail] && !isSpecialEmail) {
            throw new Error(
              "Account with this email already exists in simulated storage.",
            );
          }

          if (
            selectedTier === "free" &&
            !isSpecialEmail &&
            localStorage.getItem("gmi_free_tier_claimed") === "true"
          ) {
            throw new Error(
              "You have already claimed the free tier trial on this device. Please select another tier to proceed.",
            );
          }

          let initialCredits = isSpecialEmail ? 999999 : 10;
          let amtPaid = 0;
          let paymentTier = isSpecialEmail ? "enterprise" : selectedTier;
          let trialActive = false;
          let trialStartDate = "";
          let aiCreditsRemaining = isSpecialEmail ? 999999 : 3;
          let aiCreditsTotal = isSpecialEmail ? 999999 : 3;
          let isPro = isSpecialEmail;

          if (!isSpecialEmail) {
            isPro = paymentTier !== "free";
            if (selectedTier === "enterprise") {
              initialCredits = 999999;
              amtPaid = 299.0;
              aiCreditsRemaining = 999999;
              aiCreditsTotal = 999999;
            } else if (selectedTier === "business") {
              initialCredits = 999999;
              amtPaid = 79.99;
              aiCreditsRemaining = 999999;
              aiCreditsTotal = 999999;
            } else if (selectedTier === "professional") {
              initialCredits = 999999;
              amtPaid = 34.99;
              aiCreditsRemaining = 2500;
              aiCreditsTotal = 2500;
            } else if (selectedTier === "starter") {
              initialCredits = 100;
              amtPaid = 14.99;
              aiCreditsRemaining = 300;
              aiCreditsTotal = 300;
            } else if (selectedTier === "free") {
              initialCredits = 3;
              amtPaid = 0;
              aiCreditsRemaining = 3;
              aiCreditsTotal = 3;
              trialActive = true;
              trialStartDate = new Date().toISOString();
            }
          }

          if (paymentTier === "free") {
            localStorage.setItem("gmi_free_tier_claimed", "true");
          }

          const simulatedUser: UserAccount = {
            uid: "sim_uid_" + Math.floor(Math.random() * 88999 + 10000),
            email: email,
            paymentTier: paymentTier,
            invoiceCredits: initialCredits,
            amountPaid: amtPaid,
            invoicesCount: 0,
            createdAt: new Date().toISOString(),
            trialActive,
            trialStartDate,
            country,
            isPro,
            aiCreditsRemaining,
            aiCreditsTotal,
          };

          savedUsersCheck[lowerEmail] = {
            ...simulatedUser,
            mockPassword: password,
          };
          localStorage.setItem(
            "gmi_simulated_db_users",
            JSON.stringify(savedUsersCheck),
          );
          localStorage.setItem("gmi_current_sim_email", lowerEmail);

          onAuthSuccess(simulatedUser);
        } else {
          // login simulation
          const foundMock = savedUsersCheck[lowerEmail];
          // Allow custom bypass if they didn't exist prior in local storage
          if (!foundMock) {
            if (isSpecialEmail && password === "123") {
              const simulatedUser: UserAccount = {
                uid:
                  "sim_special_" +
                  (lowerEmail === "info@seolab.co.za" ? "seolab" : "brigitta"),
                email: lowerEmail,
                paymentTier: "enterprise",
                invoiceCredits: 999999,
                amountPaid: 0,
                invoicesCount: 15,
                createdAt: new Date().toISOString(),
              };
              savedUsersCheck[lowerEmail] = {
                ...simulatedUser,
                mockPassword: "123",
              };
              localStorage.setItem(
                "gmi_simulated_db_users",
                JSON.stringify(savedUsersCheck),
              );
              localStorage.setItem("gmi_current_sim_email", lowerEmail);
              onAuthSuccess(simulatedUser);
            } else {
              throw new Error(
                "Invalid username/password in local simulated database. Register a new account first!",
              );
            }
          } else {
            if (foundMock.mockPassword !== password) {
              if (isSpecialEmail && password === "123") {
                // Self-repairing premium access password match update
                foundMock.mockPassword = "123";
                foundMock.paymentTier = "enterprise";
                foundMock.invoiceCredits = 999999;
                savedUsersCheck[lowerEmail] = foundMock;
                localStorage.setItem(
                  "gmi_simulated_db_users",
                  JSON.stringify(savedUsersCheck),
                );
              } else {
                throw new Error(
                  "Invalid username/password. Please verify and try again.",
                );
              }
            }

            if (isSpecialEmail && foundMock.paymentTier !== "enterprise") {
              foundMock.paymentTier = "enterprise";
              foundMock.invoiceCredits = 999999;
              savedUsersCheck[lowerEmail] = foundMock;
              localStorage.setItem(
                "gmi_simulated_db_users",
                JSON.stringify(savedUsersCheck),
              );
            }

            localStorage.setItem("gmi_current_sim_email", lowerEmail);
            onAuthSuccess(foundMock);
          }
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMess(err.message || "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (selectedSpecEmail?: string) => {
    setErrorMess(null);
    setSuccessMess(null);
    setLoading(true);
    try {
      if (isRealFirebase) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        let result;
        try {
          result = await signInWithPopup(auth, provider);
        } catch (popupErr: any) {
          console.warn("Google signInWithPopup error in iframe, offering simulation fallback:", popupErr);
          const isPopupClosed = 
            popupErr.code?.includes("popup-closed-by-user") ||
            popupErr.message?.includes("popup-closed-by-user") ||
            popupErr.code?.includes("popup-blocked") ||
            popupErr.message?.includes("popup-blocked");
            
          if (isPopupClosed) {
            setErrorMess("Google Login popup was closed or blocked by iframe browser restrictions. Please type your email to authenticate instantly via simulation fallback!");
            setShowSimulatedGoogleChooser(true);
            setLoading(false);
            return;
          }
          throw popupErr;
        }
        const fUser = result.user;
        const userRef = doc(db, "users", fUser.uid);

        let userProfile: UserAccount;
        const isSpecial =
          fUser.email?.toLowerCase().trim() === "info@seolab.co.za" ||
          fUser.email?.toLowerCase().trim() === "brigittalombard09@gmail.com";
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            userProfile = userSnap.data() as UserAccount;
            if (isSpecial && userProfile.paymentTier !== "enterprise") {
              userProfile.paymentTier = "enterprise";
              userProfile.invoiceCredits = 999999;
              try {
                await setDoc(userRef, userProfile);
              } catch (e) {
                console.warn(e);
              }
            }
          } else {
            const isSpecialEmail = isSpecial;
            userProfile = {
              uid: fUser.uid,
              email: fUser.email || "",
              paymentTier: isSpecialEmail ? "enterprise" : "free",
              invoiceCredits: isSpecialEmail ? 999999 : 3,
              amountPaid: 0,
              invoicesCount: 0,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userRef, userProfile);
            } catch (e) {
              console.warn(e);
            }
          }
        } catch (fireErr) {
          console.warn(
            "Firestore getDoc/setDoc failed during Google login. Proceeding with fallback user profile.",
            fireErr,
          );
          const isSpecialEmail = isSpecial;
          userProfile = {
            uid: fUser.uid,
            email: fUser.email || "",
            paymentTier: isSpecialEmail ? "enterprise" : "free",
            invoiceCredits: isSpecialEmail ? 999999 : 3,
            amountPaid: 0,
            invoicesCount: 0,
            createdAt: new Date().toISOString(),
          };
        }
        onAuthSuccess(userProfile);
        onClose();
      } else {
        // Under simulation, if activeEmail has not been chosen from selection pane, show chooser modal view first!
        if (!selectedSpecEmail && !showSimulatedGoogleChooser) {
          setShowSimulatedGoogleChooser(true);
          setLoading(false);
          return;
        }

        // Quick popup simulated Google Log-in
        await new Promise((resolve) => setTimeout(resolve, 600));
        let activeEmail =
          selectedSpecEmail || customGoogleEmail.trim() || email.trim();
        if (!activeEmail || !activeEmail.includes("@")) {
          throw new Error(
            "Please enter a valid personal Gmail or corporate Workspace email to set up your secure workspace session.",
          );
        }
        const lowerEmail = activeEmail.toLowerCase().trim();
        const isSpecialEmail =
          lowerEmail === "info@seolab.co.za" ||
          lowerEmail === "brigittalombard09@gmail.com";

        let savedUsersCheck = JSON.parse(
          localStorage.getItem("gmi_simulated_db_users") || "{}",
        );
        let mockedUser: UserAccount;

        if (savedUsersCheck[lowerEmail]) {
          mockedUser = savedUsersCheck[lowerEmail];
          if (isSpecialEmail) {
            mockedUser.paymentTier = "enterprise";
            mockedUser.invoiceCredits = 999999;
            savedUsersCheck[lowerEmail] = mockedUser;
            localStorage.setItem(
              "gmi_simulated_db_users",
              JSON.stringify(savedUsersCheck),
            );
          }
        } else {
          mockedUser = {
            uid: isSpecialEmail
              ? "sim_special_" +
                (lowerEmail === "info@seolab.co.za" ? "seolab" : "brigitta")
              : "sim_google_" + Math.floor(Math.random() * 8000 + 1000),
            email: activeEmail,
            paymentTier: isSpecialEmail ? "enterprise" : "free",
            invoiceCredits: isSpecialEmail ? 999999 : 3,
            amountPaid: 0,
            invoicesCount: isSpecialEmail ? 15 : 4,
            createdAt: new Date().toISOString(),
          };
          savedUsersCheck[lowerEmail] = {
            ...mockedUser,
            mockPassword: isSpecialEmail ? "123" : "google_oauth_fallback",
          };
          localStorage.setItem(
            "gmi_simulated_db_users",
            JSON.stringify(savedUsersCheck),
          );
        }

        localStorage.setItem("gmi_current_sim_email", lowerEmail);
        onAuthSuccess(mockedUser);
        onClose();
      }
    } catch (err: any) {
      setErrorMess(err.message || "Google Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/75 backdrop-blur-md no-print animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-zinc-250 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
      >
        {/* Accent Banner */}
        <div className="bg-white text-zinc-900 p-4.5 sm:p-6 relative overflow-hidden shrink-0 flex items-center justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/35 rounded-full filter blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xs sm:text-sm tracking-tight text-zinc-900 uppercase">
                Audit This Doc AI Account
              </h3>
              <p className="text-[10px] sm:text-[10.5px] text-zinc-600 font-medium">
                Connect and manage dynamic credit allowances
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-900 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {showSimulatedGoogleChooser ? (
            /* Google simulated Account Chooser screen */
            <div className="space-y-4 py-2">
              <div className="text-center">
                <svg className="w-10 h-10 mx-auto mb-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <h4 className="font-sans font-bold text-sm text-zinc-900">
                  Sign in with Google
                </h4>
                <p className="text-[10.5px] text-zinc-500 mt-0.5">
                  Please enter your authentic Gmail or corporate Workspace email
                  below to verify
                </p>
              </div>

              {errorMess && (
                <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-600 text-xs font-semibold flex items-start gap-1.5 animate-fadeIn">
                  <span className="shrink-0 mt-0.5 font-bold">⚠️</span>
                  <p>{errorMess}</p>
                </div>
              )}

              <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 text-center space-y-2 font-sans">
                <span className="text-lg">📧</span>
                <p className="text-xs font-extrabold text-violet-950 uppercase tracking-wider block">
                  Your Own Email Choice
                </p>
                <p className="text-[10.5px] text-zinc-650 leading-relaxed font-semibold">
                  Once live, this leverages standard Google OAuth 2.0. In
                  current system state, please enter your personal
                  Gmail/Workspace address directly in the input below to trigger
                  automatic integration.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2">
                <label className="text-[10px] font-bold text-zinc-650 tracking-tight block uppercase">
                  Enter your Gmail / Workspace Email Address:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-250 rounded-xl text-zinc-900 focus:outline-none focus:border-violet-500 font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const emailToUse = customGoogleEmail.trim();
                      if (!emailToUse || !emailToUse.includes("@")) {
                        setErrorMess(
                          "Please enter a valid email address first.",
                        );
                        return;
                      }
                      setErrorMess(null);
                      signInWithGoogle(emailToUse);
                    }}
                    className="bg-white hover:bg-zinc-50 text-zinc-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center shrink-0 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSimulatedGoogleChooser(false);
                  setErrorMess(null);
                }}
                className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:underline py-1 mt-1 block cursor-pointer transition-colors"
              >
                ← Back to standard login
              </button>
            </div>
          ) : isForgotPassword ? (
            /* Forgot Password view state */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="text-center py-1">
                <h4 className="font-sans font-extrabold text-sm text-zinc-900 uppercase tracking-tight">
                  Recover Password
                </h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto mt-1">
                  Enter your registered email address below. We will send you a
                  secured credential adjustment link immediately.
                </p>
              </div>

              {errorMess && (
                <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-600 text-xs font-semibold flex items-start gap-1.5 animate-fadeIn">
                  <span className="shrink-0 mt-0.5 font-bold">⚠️</span>
                  <p>{errorMess}</p>
                </div>
              )}

              {successMess ? (
                <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-800 text-xs font-semibold space-y-2 animate-fadeIn">
                  <p className="font-bold flex items-center gap-1">
                    ✨ Success
                  </p>
                  <p className="font-sans font-medium">{successMess}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErrorMess(null);
                      setSuccessMess(null);
                    }}
                    className="mt-1 text-xs underline font-bold hover:text-emerald-950 block transition-colors cursor-pointer"
                  >
                    Proceed back to secure Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-650 tracking-tight block mb-1.5 uppercase">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-3 text-xs bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setErrorMess(null);
                        setSuccessMess(null);
                      }}
                      className="flex-1 border border-zinc-250 bg-white hover:bg-zinc-50 hover:border-zinc-350 text-black font-extrabold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1 transition-all outline-none"
                    >
                      ← Back to secure Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-violet-600 hover:bg-violet-750 disabled:opacity-55 active:scale-98 text-white font-black py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-violet-500/10 transition-all font-sans order-1 sm:order-2 outline-none"
                    >
                      {loading ? "Sending..." : "Send Reset Email Link"}
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* Normal Login / Register tabs */
            <>
              <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMess(null);
                    setSuccessMess(null);
                  }}
                  type="button"
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${!isSignUp ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-500 hover:text-zinc-900"}`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMess(null);
                    setSuccessMess(null);
                  }}
                  type="button"
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isSignUp ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-500 hover:text-zinc-900"}`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Account
                </button>
              </div>

              {errorMess && (
                <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-600 text-xs font-semibold flex items-start gap-1.5 animate-fadeIn">
                  <span className="shrink-0 mt-0.5 font-bold">⚠️</span>
                  <p>{errorMess}</p>
                </div>
              )}

              {successMess && (
                <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-1.5 animate-fadeIn">
                  <span className="shrink-0 mt-0.5 font-bold">✨</span>
                  <p>{successMess}</p>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-650 tracking-tight block mb-1.5 uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-3 text-xs bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-650 tracking-tight block mb-1.5 uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 text-xs bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 font-medium transition-all"
                    />
                  </div>
                  {!isSignUp && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMess(null);
                          setSuccessMess(null);
                        }}
                        className="text-[11px] text-violet-600 hover:text-violet-750 hover:underline font-bold transition-all cursor-pointer outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {isSignUp && (
                  <div className="mt-4 animate-fadeIn">
                    <label className="text-[10px] font-bold text-violet-800 tracking-tight block mb-1.5 uppercase">
                      🗺️ Select Your Country
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-zinc-50 border border-violet-200 rounded-2xl text-zinc-900 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 font-extrabold transition-all appearance-none cursor-pointer"
                      >
                        <option value="South Africa">
                          🇿🇦 South Africa (ZAR R)
                        </option>
                        <option value="United States">
                          🇺🇸 United States (USD $)
                        </option>
                        <option value="United Kingdom">
                          🇬🇧 United Kingdom (GBP £)
                        </option>
                        <option value="Germany">🇩🇪 Germany (EUR €)</option>
                        <option value="France">🇫🇷 France (EUR €)</option>
                        <option value="Canada">🇨🇦 Canada (CAD $)</option>
                        <option value="Australia">🇦🇺 Australia (AUD $)</option>
                        <option value="India">🇮🇳 India (INR ₹)</option>
                        <option value="Nigeria">🇳🇬 Nigeria (NGN ₦)</option>
                        <option value="Kenya">🇰🇪 Kenya (KES KSh)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 border border-zinc-250 bg-white hover:bg-zinc-50 hover:border-zinc-350 text-black font-extrabold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1 transition-all outline-none"
                  >
                    ❌ Cancel &amp; Close
                  </button>
                  <button
                    type="submit"
                    id="auth_modal_submit_btn"
                    disabled={loading}
                    className="flex-[2] bg-violet-600 hover:bg-violet-750 disabled:opacity-55 active:scale-98 text-white font-black py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-violet-500/10 transition-all font-sans order-1 sm:order-2 outline-none"
                  >
                    {loading ? (
                      <>
                        <Coins className="w-4 h-4 animate-spin" />
                        Securing authorization...
                      </>
                    ) : isSignUp ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account &amp; Let's Go
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Secure Login &amp; Let's Go
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="relative flex items-center justify-center py-2 shrink-0">
                <span className="absolute left-0 right-0 h-px bg-zinc-200"></span>
                <span className="relative bg-white px-3 font-mono text-[9px] font-bold text-zinc-600 uppercase tracking-widest select-none">
                  Or authenticate instantly
                </span>
              </div>

              <button
                type="button"
                id="google_instant_auth_btn"
                onClick={() => signInWithGoogle()}
                disabled={loading}
                className="w-full border border-zinc-250 bg-white hover:bg-zinc-50 hover:border-zinc-350 hover:shadow-xs text-black font-extrabold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                title="Authenticate instantly with Google"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 5.918 1 12s5.033 11 11.24 11c6.478 0 10.793-4.437 10.793-10.707 0-.724-.077-1.282-.172-1.708h-10.62z"
                  />
                </svg>
                ⚡ Instant Sign Up / Log In with Google
              </button>

              <p className="text-center text-[10px] font-medium text-zinc-500 max-w-xs mx-auto">
                {!isRealFirebase && (
                  <span className="bg-emerald-50 text-emerald-800 py-0.5 px-2 rounded-full font-bold uppercase inline-block mb-1 tracking-wide text-[8px]">
                    Mock Sandbox Active
                  </span>
                )}
                <br />
                Secure TLS encryption guarantees all structural ledgers stay
                100% compliant with standard terms.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
