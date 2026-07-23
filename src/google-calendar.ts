import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.compose');
provider.addScope('https://www.googleapis.com/auth/gmail.insert');
provider.addScope('https://www.googleapis.com/auth/gmail.labels');
provider.addScope('https://www.googleapis.com/auth/gmail.metadata');
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.settings.basic');
provider.addScope('https://www.googleapis.com/auth/gmail.settings.sharing');
provider.addScope('https://www.googleapis.com/auth/gmail.addons.current.action.compose');
provider.addScope('https://www.googleapis.com/auth/gmail.addons.current.message.action');
provider.addScope('https://www.googleapis.com/auth/gmail.addons.current.message.metadata');
provider.addScope('https://www.googleapis.com/auth/gmail.addons.current.message.readonly');
provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
provider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');
provider.addScope('https://www.googleapis.com/auth/meetings.space.settings');

provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/documents.readonly');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/presentations');
provider.addScope('https://www.googleapis.com/auth/presentations.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/contacts');
provider.addScope('https://www.googleapis.com/auth/contacts.other.readonly');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
provider.addScope('https://www.googleapis.com/auth/directory.readonly');
provider.addScope('https://www.googleapis.com/auth/user.addresses.read');
provider.addScope('https://www.googleapis.com/auth/user.birthday.read');
provider.addScope('https://www.googleapis.com/auth/user.emails.read');
provider.addScope('https://www.googleapis.com/auth/user.gender.read');
provider.addScope('https://www.googleapis.com/auth/user.organization.read');
provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user')) {
      console.warn('Sign in popup closed by user.');
      return null;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const syncEventToGoogleCalendar = async (
  token: string, 
  title: string, 
  description: string, 
  dateStr: string
) => {
  const startTimer = new Date(dateStr);
  const endTimer = new Date(startTimer.getTime() + 60 * 60 * 1000); // 1 hour long
  
  const event = {
    summary: title,
    description: description,
    start: {
      dateTime: startTimer.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    end: {
      dateTime: endTimer.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Calendar sync error", err);
    throw new Error('Failed to create calendar event');
  }

  return await res.json();
};

export const sendEmailViaGmailAPI = async (
  token: string,
  to: string,
  subject: string,
  body: string
) => {
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body
  ];
  
  const emailStr = emailLines.join('\r\n');
  const encodedEmail = btoa(unescape(encodeURIComponent(emailStr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  const res = await fetch('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Gmail send error', errorData);
    throw new Error('Failed to send email via Gmail');
  }
  
  return await res.json();
};

export const createGoogleMeetSpace = async (token: string) => {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error('Meet API error', errorData);
    throw new Error('Failed to create Google Meet space');
  }

  return await res.json();
};

export const createGoogleDoc = async (token: string, title: string, textContent: string) => {
  // Create a new document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    console.error('Docs API create error', errorData);
    throw new Error('Failed to create Google Doc');
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // If we have text to insert
  if (textContent) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: textContent
            }
          }
        ]
      })
    });

    if (!updateRes.ok) {
      console.error('Failed to insert text into doc');
    }
  }

  return documentId;
};

export const createGoogleSlides = async (token: string, title: string, subtitle: string) => {
  // Create a new presentation
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    console.error('Slides API create error', errorData);
    throw new Error('Failed to create Google Slide presentation');
  }

  const presentation = await createRes.json();
  const presentationId = presentation.presentationId;

  // Attempt to populate the initial slide's title and subtitle if layout allows
  try {
    const firstSlide = presentation.slides[0];
    const elements = firstSlide?.pageElements || [];
    
    // Find centered title and subtitle shape (typically at indices 0 and 1 in standard templates)
    const titleObj = elements.find((el: any) => el.shape?.placeholder?.type === 'CENTERED_TITLE' || el.shape?.placeholder?.type === 'TITLE');
    const subtitleObj = elements.find((el: any) => el.shape?.placeholder?.type === 'SUBTITLE');

    const requests = [];
    if (titleObj && title) {
      requests.push({
        insertText: {
          objectId: titleObj.objectId,
          text: title
        }
      });
    }
    if (subtitleObj && subtitle) {
      requests.push({
        insertText: {
          objectId: subtitleObj.objectId,
          text: subtitle
        }
      });
    }

    if (requests.length > 0) {
      await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests })
      });
    }
  } catch (e) {
    console.log("Could not auto-fill title slide elements", e);
  }

  return presentationId;
};

export const getGoogleContacts = async (token: string) => {
  const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error("Failed to fetch Google Contacts");
  }
  return await res.json();
};
