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
      - generic [ref=e10]: Toggle theme
    - generic [ref=e14]:
      - generic [ref=e15]:
        - img "Logo" [ref=e17]
        - generic [ref=e18]: Reset Password
        - generic [ref=e19]: Masukkan email Anda untuk menerima link reset password
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: Email
            - generic [ref=e24]:
              - img [ref=e25]
              - textbox "Email" [ref=e28]:
                - /placeholder: nama@email.com
          - button "Kirim Link Reset" [ref=e30]:
            - text: Kirim Link Reset
            - img
        - link "Kembali ke Login" [ref=e32] [cursor=pointer]:
          - /url: /login
  - button "Open Next.js Dev Tools" [ref=e38] [cursor=pointer]:
    - img [ref=e39]
  - alert [ref=e42]
```