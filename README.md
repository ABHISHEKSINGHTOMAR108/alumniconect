# AlumniConnect Hub

Build a full-stack Alumni Management System web app called "AlumniConnect" 

for a college, with Supabase backend.



Features needed:

1. Authentication - alumni and admin login/register (email + password)

2. Alumni Directory - list of alumni with search bar and filters by 

   graduation batch and branch. Each alumni card shows name, batch, 

   branch, current company, job title, location, and a short bio.

3. Events - admin/alumni can create events (title, date, location, 

   description). All users can view upcoming events and RSVP. Show 

   live attendee count per event.

4. Job Board - alumni can post job/internship openings (title, company, 

   location, type, description). All users can browse the job feed.

5. Donations - alumni can record a contribution (amount + cause). Show 

   a running total raised and a list of past contributions.

6. Profile Page - logged-in user can view and edit their own profile 

   (name, batch, branch, company, job title, location, bio).

7. Dashboard - homepage showing summary stats: total alumni, total 

   events, open job count, total donations raised, and the next 

   upcoming event.



Design: clean, modern dark-themed dashboard UI with a sidebar 

navigation (collapsing to bottom tab bar on mobile), card-based 

layouts, and a blue/purple accent color. Fully responsive for mobile.



Use Supabase for the database (tables: users/profiles, events, 

event_rsvps, jobs, donations) and Supabase Auth for login/signup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://alumniconect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a9380bd2-570c-4f13-9c20-8855b8db1c5a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
