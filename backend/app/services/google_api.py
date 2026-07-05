import os
import datetime
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

class GoogleApiService:
    def __init__(self, google_token: dict = None, is_mock: bool = True):
        self.is_mock = is_mock
        self.google_token = google_token
        self.calendar_client = None
        self.gmail_client = None
        self.drive_client = None

        if not self.is_mock and self.google_token:
            try:
                creds = Credentials(
                    token=self.google_token.get("access_token"),
                    refresh_token=self.google_token.get("refresh_token"),
                    token_uri=self.google_token.get("token_uri"),
                    client_id=self.google_token.get("client_id"),
                    client_secret=self.google_token.get("client_secret"),
                    scopes=self.google_token.get("scopes")
                )
                self.calendar_client = build('calendar', 'v3', credentials=creds)
                self.gmail_client = build('gmail', 'v1', credentials=creds)
                self.drive_client = build('drive', 'v3', credentials=creds)
            except Exception as e:
                print(f"Error building real Google API clients: {e}. Falling back to mock data.")
                self.is_mock = True

    # --- CALENDAR OPERATIONS ---
    def list_calendar_events(self, time_min: str = None, time_max: str = None) -> list:
        """
        Fetches upcoming calendar events.
        """
        if self.is_mock:
            # Return realistic university student events
            now = datetime.datetime.now()
            today_str = now.strftime('%Y-%m-%d')
            
            # Helper to generate ISO strings relative to today
            def relative_time(days_offset=0, hour=9, minute=0):
                target_date = now + datetime.timedelta(days=days_offset)
                return target_date.replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat()

            events = [
                {
                    "id": "mock_class_1",
                    "summary": "[AcademeIQ] Class: Computer Vision (CS 461)",
                    "description": "Lecture on CNNs and Edge Detection algorithms. Dr. Khalid Ahmed.",
                    "start": {"dateTime": relative_time(0, 9, 0), "timeZone": "UTC"},
                    "end": {"dateTime": relative_time(0, 10, 30), "timeZone": "UTC"},
                    "colorId": "1"  # Lavender
                },
                {
                    "id": "mock_class_2",
                    "summary": "[AcademeIQ] Class: Knowledge Based Systems (CS 463)",
                    "description": "Expert Systems and Prolog programming fundamentals. Dr. S. Jamil.",
                    "start": {"dateTime": relative_time(1, 11, 0), "timeZone": "UTC"},
                    "end": {"dateTime": relative_time(1, 12, 30), "timeZone": "UTC"},
                    "colorId": "2"  # Sage
                },
                {
                    "id": "mock_lab_1",
                    "summary": "[AcademeIQ] Lab: Networks (CS 465)",
                    "description": "Hands-on packet analysis with Wireshark. Group lab report submission.",
                    "start": {"dateTime": relative_time(0, 14, 0), "timeZone": "UTC"},
                    "end": {"dateTime": relative_time(0, 17, 0), "timeZone": "UTC"},
                    "colorId": "5"  # Banana
                },
                {
                    "id": "mock_study_1",
                    "summary": "[AcademeIQ] Study Block: CV Assignment 2",
                    "description": "Implementing Sobel filters and Hough transform in Python.",
                    "start": {"dateTime": relative_time(2, 18, 0), "timeZone": "UTC"},
                    "end": {"dateTime": relative_time(2, 20, 0), "timeZone": "UTC"},
                    "colorId": "9"  # Blueberry
                },
                {
                    "id": "mock_exam_1",
                    "summary": "[AcademeIQ] Exam: KBS Midterm",
                    "description": "Midterm exam covering semantic networks, search algorithms, and inference engines.",
                    "start": {"dateTime": relative_time(6, 10, 0), "timeZone": "UTC"},
                    "end": {"dateTime": relative_time(6, 12, 0), "timeZone": "UTC"},
                    "colorId": "11"  # Tomato
                }
            ]
            return events

        try:
            # Real calendar API call
            if not time_min:
                time_min = datetime.datetime.utcnow().isoformat() + 'Z'
            events_result = self.calendar_client.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            return events_result.get('items', [])
        except Exception as e:
            print(f"Calendar API error: {e}")
            return []

    # --- GMAIL OPERATIONS ---
    def list_gmail_messages(self, query: str = "", max_results: int = 10) -> list:
        """
        Lists message headers matching a query.
        """
        if self.is_mock:
            # Return list of mock emails
            return [
                {"id": "mock_msg_1", "threadId": "mock_thread_1"},
                {"id": "mock_msg_2", "threadId": "mock_thread_2"},
                {"id": "mock_msg_3", "threadId": "mock_thread_3"}
            ]

        try:
            response = self.gmail_client.users().messages().list(
                userId='me', q=query, maxResults=max_results
            ).execute()
            return response.get('messages', [])
        except Exception as e:
            print(f"Gmail list API error: {e}")
            return []

    def get_gmail_message(self, message_id: str) -> dict:
        """
        Retrieves a detailed message payload.
        """
        if self.is_mock or message_id.startswith("mock_"):
            mock_emails = {
                "mock_msg_1": {
                    "id": "mock_msg_1",
                    "snippet": "Dear class, I have extended the submission deadline for the Computer Vision Lab Report to Saturday, July 4th at 11:59 PM...",
                    "payload": {
                        "headers": [
                            {"name": "From", "value": "Dr. Khalid Ahmed <khalid.ahmed@university.edu>"},
                            {"name": "Subject", "value": "CS 461 — Lab Report Submission Deadline Extension"},
                            {"name": "Date", "value": "Wed, 01 Jul 2026 14:15:00 +0000"}
                        ],
                        "body": {
                            "data": "Dear class,\n\nI have extended the submission deadline for the Computer Vision Lab Report to Saturday, July 4th at 11:59 PM. Please make sure to submit on time.\n\nBest regards,\nDr. Khalid Ahmed"
                        }
                    }
                },
                "mock_msg_2": {
                    "id": "mock_msg_2",
                    "snippet": "Please find the Midterm Examination schedule attached. Exams will start on Monday, July 6th, 2026. The KBS exam is scheduled...",
                    "payload": {
                        "headers": [
                            {"name": "From", "value": "Academic Registrar <registrar@university.edu>"},
                            {"name": "Subject", "value": "Midterm Examination Schedule Announcement"},
                            {"name": "Date", "value": "Tue, 30 Jun 2026 09:30:00 +0000"}
                        ],
                        "body": {
                            "data": "Dear Students,\n\nPlease find the Midterm Examination schedule attached. Exams will start on Monday, July 6th, 2026. The KBS exam is scheduled for Wednesday, July 8th.\n\nOffice of the Registrar"
                        }
                    }
                },
                "mock_msg_3": {
                    "id": "mock_msg_3",
                    "snippet": "Hello group, please coordinate your slides by Friday, July 3rd, for our final Networks presentation slides submission...",
                    "payload": {
                        "headers": [
                            {"name": "From", "value": "Prof. Sara Khan <sara.khan@university.edu>"},
                            {"name": "Subject", "value": "CS 465 — Group project updates"},
                            {"name": "Date", "value": "Mon, 29 Jun 2026 11:00:00 +0000"}
                        ],
                        "body": {
                            "data": "Hello group,\n\nPlease coordinate your slides by Friday, July 3rd, for our final Networks presentation slides submission.\n\nProf. Sara Khan"
                        }
                    }
                }
            }
            return mock_emails.get(message_id, mock_emails["mock_msg_1"])

        try:
            return self.gmail_client.users().messages().get(
                userId='me', id=message_id, format='full'
            ).execute()
        except Exception as e:
            print(f"Gmail get API error: {e}")
            return {}

    # --- DRIVE OPERATIONS ---
    def list_drive_files(self, query: str = "", max_results: int = 10) -> list:
        """
        Lists files in Google Drive.
        """
        if self.is_mock:
            return [
                {
                    "id": "mock_file_1",
                    "name": "CV_Assignment2_Brief.pdf",
                    "mimeType": "application/pdf",
                    "modifiedTime": "2026-06-28T14:32:00Z"
                },
                {
                    "id": "mock_file_2",
                    "name": "Networks_Lecture_Notes_7.pdf",
                    "mimeType": "application/pdf",
                    "modifiedTime": "2026-06-29T10:15:00Z"
                },
                {
                    "id": "mock_file_3",
                    "name": "KBS_Past_Paper_2025.pdf",
                    "mimeType": "application/pdf",
                    "modifiedTime": "2026-06-30T16:45:00Z"
                }
            ]

        try:
            response = self.drive_client.files().list(
                q=query, pageSize=max_results, fields="files(id, name, mimeType, modifiedTime)"
            ).execute()
            return response.get('files', [])
        except Exception as e:
            print(f"Drive list API error: {e}")
            return []

    # --- WRITE OPERATIONS ---
    def create_calendar_event(self, summary: str, start_time: str, end_time: str, description: str = "") -> dict:
        """
        Creates a new calendar event.
        """
        if self.is_mock:
            return {
                "status": "success",
                "id": f"mock_event_{int(datetime.datetime.now().timestamp())}",
                "summary": summary,
                "start": {"dateTime": start_time},
                "end": {"dateTime": end_time},
                "description": description
            }
        try:
            event_body = {
                'summary': summary,
                'description': description,
                'start': {'dateTime': start_time},
                'end': {'dateTime': end_time}
            }
            res = self.calendar_client.events().insert(calendarId='primary', body=event_body).execute()
            return res
        except Exception as e:
            print(f"Error creating calendar event: {e}")
            raise e

    def send_gmail_message(self, to: str, subject: str, body: str) -> dict:
        """
        Sends an email message.
        """
        if self.is_mock:
            return {
                "status": "success",
                "id": f"mock_msg_{int(datetime.datetime.now().timestamp())}",
                "to": to,
                "subject": subject
            }
        try:
            import base64
            from email.mime.text import MIMEText
            message = MIMEText(body)
            message['to'] = to
            message['subject'] = subject
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            res = self.gmail_client.users().messages().send(userId='me', body={'raw': raw}).execute()
            return res
        except Exception as e:
            print(f"Error sending email: {e}")
            raise e

    def create_gmail_draft(self, to: str, subject: str, body: str) -> dict:
        """
        Creates an email draft.
        """
        if self.is_mock:
            return {
                "status": "success",
                "id": f"mock_draft_{int(datetime.datetime.now().timestamp())}",
                "to": to,
                "subject": subject
            }
        try:
            import base64
            from email.mime.text import MIMEText
            message = MIMEText(body)
            message['to'] = to
            message['subject'] = subject
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            res = self.gmail_client.users().drafts().create(userId='me', body={'message': {'raw': raw}}).execute()
            return res
        except Exception as e:
            print(f"Error creating draft: {e}")
            raise e

    def create_drive_file(self, filename: str, content: str, mime_type: str = "text/plain") -> dict:
        """
        Creates a new file in Google Drive.
        """
        if self.is_mock:
            return {
                "status": "success",
                "id": f"mock_file_{int(datetime.datetime.now().timestamp())}",
                "name": filename
            }
        try:
            from googleapiclient.http import MediaByteArrayUpload
            media = MediaByteArrayUpload(content.encode('utf-8'), mimetype=mime_type, resumable=True)
            res = self.drive_client.files().create(body={'name': filename}, media_body=media, fields='id').execute()
            return res
        except Exception as e:
            print(f"Error creating drive file: {e}")
            raise e
