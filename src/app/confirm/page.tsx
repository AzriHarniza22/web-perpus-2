export default function ConfirmPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Cek Email Anda
            </h2>
            <p className="mt-4 text-sm text-gray-600">
              Kami telah mengirimkan email konfirmasi ke:
            </p>
            {searchParams.email && (
              <p className="mt-2 text-base font-medium text-gray-900">
                {searchParams.email}
              </p>
            )}
            <div className="mt-6 text-sm text-gray-600 space-y-2">
              <p>
                Silakan klik link konfirmasi di email tersebut untuk mengaktifkan akun Anda.
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Tidak menerima email? Cek folder spam/junk Anda atau tunggu beberapa menit.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <a
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Kembali ke Login
            </a>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Catatan Penting</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Email konfirmasi biasanya tiba dalam 1-5 menit</li>
                  <li>Link konfirmasi akan kadaluarsa dalam 24 jam</li>
                  <li>Anda tidak bisa login sebelum mengkonfirmasi email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}