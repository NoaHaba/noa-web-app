
import { Link } from "react-router";
import styles from "./HomePage.module.css";

const projects = [
  {
    title: "Tic-Tac-Toe",
    description:
      "Play a game of misère tic-tac-toe, where making three in a row means you lose.",
    path: "/tic-tac-toe",
    number: "01",
  },
  {
    title: "NASA Space Pictures",
    description:
      "Discover astronomy pictures and get simple explanations in Hebrew using AI.",
    path: "/nasa",
    number: "02",
  },
  {
    title: "Copy That Design",
    description:
      "Explore a responsive design created in collaboration with a designer.",
    path: "/design",
    number: "03",
  },
];

export default function HomePage() {
  return (
    <main className={styles.home}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>PRODUCT JAM 2027</p>
        <h1>Welcome to My Web App</h1>
        <p className={styles.intro}>
          Three projects combining interactive games, space exploration,
          and responsive web design.
        </p>
      </section>

      <section className={styles.projects}>
        <h2>Explore the Projects</h2>

        <div className={styles.grid}>
          {projects.map((project) => (
            <Link
              key={project.path}
              to={project.path}
              className={styles.card}
            >
              <span className={styles.number}>
                {project.number}
              </span>

              <h3>{project.title}</h3>
              <p>{project.description}</p>

              <span className={styles.cardLink}>
                Explore project →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
