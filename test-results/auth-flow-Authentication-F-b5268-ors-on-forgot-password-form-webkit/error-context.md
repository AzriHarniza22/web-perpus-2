# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - link "Kembali" [ref=e6]:
      - /url: /
      - button "Kembali" [ref=e7]:
        - img
        - text: Kembali
    - button "Toggle theme" [ref=e9]:
      - generic [ref=e10]: Toggle theme
    - generic [ref=e12]:
      - generic [ref=e14]:
        - img "Gedung Perpustakaan Aceh" [ref=e15]
        - generic [ref=e18]:
          - heading "Lupa Password?" [level=2] [ref=e19]
          - paragraph [ref=e20]: Jangan khawatir, kami akan membantu Anda mengatur ulang password dengan aman.
      - generic [ref=e22]:
        - generic [ref=e23]:
          - img "Logo" [ref=e25]
          - generic [ref=e26]: Reset Password
          - generic [ref=e27]: Masukkan email Anda untuk menerima link reset password
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]:
              - generic [ref=e31]: Email
              - generic [ref=e32]:
                - img [ref=e33]
                - textbox "Email" [active] [ref=e36]:
                  - /placeholder: nama@email.com
            - button "Kirim Link Reset" [ref=e38]:
              - text: Kirim Link Reset
              - img
          - link "Kembali ke Login" [ref=e40]:
            - /url: /login
  - button "Open Next.js Dev Tools" [ref=e46] [cursor=pointer]:
    - img [ref=e47]
  - alert [ref=e52]
```