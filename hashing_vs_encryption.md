# Hashing vs Encryption — Interview-ready explanation 🔐🧠

This is one of the most important security concepts you will learn. If you can explain this clearly in an interview, you show that you understand trust and liability, not just code.

---

## Short answer

**Encryption is reversible (two-way). Hashing is one-way and intentionally irreversible.**

- Use **hashing** for passwords.
- Use **encryption** when you need to recover the original data (e.g., credit card numbers, messages that must be read later).

---

## The core difference: The Safe vs. The Blender

- **Encryption (Two-way)** — Think of a **Safe**. You lock data with a key and later open it with the same (or related) key. If someone steals the key, they can unlock everything.
- **Hashing (One-way)** — Think of a **Blender**. You put a strawberry (the password) in and blend it. You get a smoothie (the hash). You cannot turn the smoothie back into the strawberry.

This analogy helps you explain why we never *encrypt* passwords.

---

## The hacker scenario — Why encryption for passwords fails

Imagine your app has 1,000,000 users.

- **You used encryption:** To validate logins you must decrypt the stored value. That means your server stores the key. If a hacker steals the database *and* the key, they decrypt every password instantly — total compromise.

- **You used hashing (e.g., bcrypt):** The attacker steals the database and sees only hashed strings (e.g., `$2b$10$X8f...`). They cannot reverse those hashes. Cracking even one password requires enormous compute/time and targeted effort.

Result: hashing reduces the blast radius dramatically because there is no single secret that decrypts all passwords.

---

## How do logins work if you can't reverse the hash?

You do the same operation (replay the blend):

1. Sign up: User types `password123`. Server computes `Hash(password123)` → `HashXYZ` and stores `HashXYZ`.
2. Log in: User types `password123`. Server computes `Hash(password123)` → compare with `HashXYZ`.
3. If they match → success; otherwise → reject.

Important: Use a slow, adaptive hashing algorithm (bcrypt, Argon2, scrypt) with a salt and configurable cost factor to slow down brute-force attacks.

---

## When should you use encryption?

Use encryption when you need to recover the original value later:

- Credit card numbers (if you must send them to a payment provider and need to decrypt)
- Shipping addresses (you may need to print them)
- Private messages (recipient needs to read plaintext)

Encryption is appropriate for data that must be recovered, but it introduces a key management problem: keep keys secure (HSM, KMS, or secrets managers) and rotate them carefully.

---

## Interview summary (one-liner you can use)

"We hash passwords (one-way) because there's no need to recover the original text — this avoids a single-point-of-failure key that would expose all user credentials; encryption should be used only when we must recover plaintext and then only with strict key management." 

---

## Quick best-practices

- Use `bcrypt`, `argon2`, or `scrypt` for passwords (avoid plain SHA-1/SHA-256 without salts and iterations).
- Always use a unique salt per password (modern libraries do this for you).
- Use a high cost factor that fits your hardware and threat model.
- Never log raw passwords.
- For data that must be decrypted, use secure key management (KMS/HSM) and never hard-code keys.

---

If you'd like, I can:

- Add `bcrypt` to the project and implement hashing in `UsersService`.
- Re-enable the `password` field in `CreateUserDto` and add tests for signup/login flows.

Tell me which step you'd like me to take next.