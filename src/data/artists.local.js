/**
 * Donnees locales de secours.
 * Utilisees quand Supabase n'est pas configure (pas de fichier .env).
 * Les chemins pointent vers public/assets/... (servis a la racine).
 */
const artists = [
  {
    id: "pr",
    name: "Le Programme SESAME",
    img: "assets/img/pr.jpeg",
    tracks: [
      {
        title: "Hymne du 10ème anniversaire du Programme SESAME",
        duration: "03:21",
        src: "assets/media/music3.mp3",
      },
    ],
  },
  {
    id: "cd",
    name: "Céline Dion",
    img: "assets/img/celine.jpeg",
    tracks: [
      { title: "Hymne à l'amitié", duration: "", src: "assets/media/cd1.mp3" },
    ],
  },
  {
    id: "poopy",
    name: "Poopy",
    img: "assets/img/poopy.jpg",
    tracks: [
      { title: "Tena namana", duration: "04:23", src: "assets/media/po.mp3" },
    ],
  },
  {
    id: "louane",
    name: "Louane",
    img: "assets/img/lou.jpeg",
    tracks: [
      { title: "Je vole", duration: "03:25", src: "assets/media/louv.mp3" },
      {
        title: "Je vais t'aimer",
        duration: "03:25",
        src: "assets/media/loujv.mp3",
      },
    ],
  },
  {
    id: "jacque",
    name: "Jean-Jacques Goldman",
    img: "assets/img/jjg.jpeg",
    tracks: [
      {
        title: "Au bout de mes rêves",
        duration: "03:37",
        src: "assets/media/Au bout.mp3",
      },
      { title: "Là-bas", duration: "04:53", src: "assets/media/La bas.mp3" },
      { title: "Nos mains", duration: "03:18", src: "assets/media/Nos.mp3" },
    ],
  },
];

export default artists;
