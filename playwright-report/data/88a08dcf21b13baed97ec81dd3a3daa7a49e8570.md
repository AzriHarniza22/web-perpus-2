# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Kembali" [ref=e6] [cursor=pointer]:
      - /url: /
      - button "Kembali" [ref=e7]:
        - img
        - text: Kembali
    - button "Toggle theme" [ref=e9]:
      - img
      - img
      - generic [ref=e10]: Toggle theme
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic:
          - img "Logo"
        - generic [ref=e16]: Reset Password
        - generic [ref=e17]: Masukkan email Anda untuk menerima link reset password
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - generic [ref=e21]: Email
            - generic [ref=e22]:
              - img [ref=e23]
              - textbox "Email" [ref=e26]:
                - /placeholder: nama@email.com
          - button "Kirim Link Reset" [ref=e28]:
            - text: Kirim Link Reset
            - img
        - link "Kembali ke Login" [ref=e30] [cursor=pointer]:
          - /url: /login
  - alert [ref=e31]
```