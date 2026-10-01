export default function About() {
  return (
    <div className="row g-4 align-items-stretch fade-in p-2 p-md-3">
      <div className="col-md-6 text-center">
        <div className="avatar avatar--about mx-auto">
          <img src="/assets/img/me.png" alt="R. Dylane Gimode" />
        </div>
        <div className="text-white rounded-2 p-3">
          <h1>R. Dylane Gimode</h1>
          <h4 className="text-white-50">Apprenti développeur web</h4>
        </div>
      </div>

      <div className="col-md-6">
        <div className="about-card d-flex flex-column h-100 p-3 rounded-3">
          <p className="lorem-ipsum">
            «&nbsp;Ce n'est qu'en changeant l'éducation qu'on pourra changer le
            monde&nbsp;»
            <br />
            Ce slogan de SESAME exprime clairement que l'éducation est l'élément
            clé pour façonner un avenir meilleur.
            <br />
            Je suis un étudiant passionné par l'informatique et j'aspire à en
            faire mon métier en tant que développeur web (front-end). J'ai eu la
            chance de bénéficier du programme SESAME.
            <br />
            Alors je tiens à remercier le programme pour cette grande
            opportunité qu'il m'a offerte.
            <br />
            <i>Merci SESAME.</i>
          </p>

          <div className="mt-auto">
            <div className="social-links rounded-3 p-2 d-grid gap-1">
              <div className="social-row">
                <i className="fa-solid fa-phone" style={{ color: "var(--accent)" }}></i>
                <span>034 49 185 29</span>
              </div>
              <div className="social-row">
                <i className="fa-brands fa-linkedin" style={{ color: "#4aa3df" }}></i>
                <span>Dylane</span>
              </div>
              <div className="social-row">
                <i className="fa-brands fa-facebook" style={{ color: "#4aa3df" }}></i>
                <span>Dylane Gidy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
