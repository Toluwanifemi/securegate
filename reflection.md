SecureGate — Reflection \& Engineering Analysis

Name: Oluwanifemi Ajibola

Cohort: Design to MVP Bootcamp

Live URL: https://securegate-one.vercel.app/

GitHub Repo: https://github.com/Toluwanifemi/securegate



## Part 1 — What I Built
I built an email authentication system called SecureGate. It allows users to sign up and log in using their email address and password. Users can also reset their password and verify their email address.

## Part 2 — What Surprised Me

Deploying an app and making it run in real time. I learnt that building locally can go perfectly but in production a lot of things could go wrong. I ran into internal server error multiple times.

## Part 3 — Engineering Laws Quiz
### Q1 — Murphy's Law
Code reference: app/login/page.tsx
My Answer: In the login form, i used a call back URL to redirect after login without proper search query.
What goes wrong if ignored: a phisher could inject another URL and a user will be redirected to the wrong platform

### Q2 Law of leaky abstractions

Code Reference: app\api\register\route.ts line 102ff
When two users try to register with the same email at the same time, a race condition occurs. My code first checks if the email exists (findUnique), then tries to create the user. Between those two steps, another request might slip in. Prisma correctly throws a P2002 Unique Constraint error, but my code catches it and responds with a generic 500 Internal Server Error. That makes it look like the system crashed, when in reality, it is a duplicate email.

### Q3 YAGNI
Code Reference:
I had an unused CSS module boilerplate 
What goes wrong if ignored: It adds clusters and increases the build size of my app





## Part 4 — One Thing I Would Refactor

Proper setup of database. The issues I faced during deployment were due to improper setup of the database