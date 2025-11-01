# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Kembali" [ref=e6]:
    - /url: /
    - button "Kembali" [ref=e7]:
      - img
      - text: Kembali
  - generic [ref=e12]:
    - generic [ref=e13]:
      - heading "Masuk ke Akun Anda" [level=1] [ref=e14]
      - paragraph [ref=e15]: Sistem Reservasi Ruangan Perpustakaan
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Email
          - generic [ref=e20]:
            - img [ref=e21]
            - textbox "Email" [ref=e24]:
              - /placeholder: nama@email.com
        - generic [ref=e25]:
          - generic [ref=e26]: Password
          - generic [ref=e27]:
            - img [ref=e28]
            - textbox "Password" [ref=e31]:
              - /placeholder: Masukkan password
            - button "Tampilkan password" [ref=e32]:
              - img [ref=e33]
        - button "Lupa password?" [ref=e37]
        - button "Masuk" [ref=e39]:
          - text: Masuk
          - img
      - paragraph [ref=e41]:
        - text: Belum punya akun?
        - link "Daftar di sini" [ref=e42]:
          - /url: /signup
```