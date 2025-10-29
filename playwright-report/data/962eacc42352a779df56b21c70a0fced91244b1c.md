# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Kembali" [ref=e6]:
    - /url: /
    - button "Kembali" [ref=e7]:
      - img
      - text: Kembali
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "Selamat Datang" [level=1] [ref=e15]
      - paragraph [ref=e16]: Masuk ke akun Anda untuk melakukan reservasi ruangan
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: Email
        - generic [ref=e20]:
          - img [ref=e21]
          - textbox "Email address" [ref=e24]:
            - /placeholder: nama@email.com
      - generic [ref=e25]:
        - generic [ref=e26]: Password
        - generic [ref=e27]:
          - img [ref=e28]
          - textbox "Password" [ref=e31]:
            - /placeholder: Masukkan password
          - button "Tampilkan password" [ref=e32]:
            - img [ref=e33]
      - button "Masuk" [ref=e37]:
        - text: Masuk
        - img
    - paragraph [ref=e38]:
      - text: Belum punya akun?
      - link "Daftar di sini" [ref=e39]:
        - /url: /register
    - paragraph [ref=e40]:
      - text: Lupa password?
      - link "Reset di sini" [ref=e41]:
        - /url: /forgot-password
```