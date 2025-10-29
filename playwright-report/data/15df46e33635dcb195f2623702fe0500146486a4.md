# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Kembali" [ref=e6] [cursor=pointer]:
    - /url: /
    - button "Kembali" [ref=e7]:
      - img
      - text: Kembali
  - generic [ref=e9]:
    - generic [ref=e11]:
      - img "Gedung Perpustakaan Aceh" [ref=e12]
      - generic [ref=e15]:
        - heading "Lupa Password?" [level=2] [ref=e16]
        - paragraph [ref=e17]: Jangan khawatir, kami akan membantu Anda mengatur ulang password dengan aman.
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic:
          - img "Logo"
        - generic [ref=e21]: Reset Password
        - generic [ref=e22]: Masukkan email Anda untuk menerima link reset password
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: Email
            - generic [ref=e27]:
              - img [ref=e28]
              - textbox "Email" [ref=e31]:
                - /placeholder: nama@email.com
          - button "Kirim Link Reset" [ref=e33]:
            - text: Kirim Link Reset
            - img
        - link "Kembali ke Login" [ref=e35] [cursor=pointer]:
          - /url: /login
```