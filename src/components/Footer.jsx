export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="site-footer text-center text-white py-4 px-3">
      <p className="mb-0">
        &copy; {year} Hira'Alefako &middot; Projet SESAME &middot; R. Dylane
        Gimode
      </p>
    </div>
  );
}
