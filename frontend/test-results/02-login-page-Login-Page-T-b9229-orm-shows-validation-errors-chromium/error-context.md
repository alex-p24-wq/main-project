# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img "Cardamom" [ref=e6]
    - heading "Welcome to Nature 🌱" [level=2] [ref=e7]
  - generic [ref=e8]:
    - heading "Welcome Back 👋" [level=2] [ref=e9]
    - paragraph [ref=e10]: Login to continue your journey
    - generic [ref=e11]:
      - textbox "Username" [active] [ref=e13]
      - textbox "Password" [ref=e15]
      - button "Login" [ref=e16] [cursor=pointer]
    - generic [ref=e18]: or continue with
    - generic [ref=e19]:
      - button "Google Google" [ref=e20] [cursor=pointer]:
        - img "Google" [ref=e21]
        - text: Google
      - button "Facebook Facebook" [ref=e22] [cursor=pointer]:
        - img "Facebook" [ref=e23]
        - text: Facebook
    - paragraph [ref=e24]:
      - text: Don't have an account?
      - link "Register" [ref=e25] [cursor=pointer]:
        - /url: /register
```