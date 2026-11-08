import type { ReactNode } from "react";
import styles from "./DesignPage.module.css";
import imgEllipse7 from "./assets/imgEllipse7.png";
import imgEllipse1 from "./assets/imgEllipse1.svg";
import imgEllipse3 from "./assets/imgEllipse3.svg";
import imgEllipse2 from "./assets/imgEllipse2.svg";
import imgEllipse4 from "./assets/imgEllipse4.svg";
import imgGroup15 from "./assets/imgGroup15.svg";
import imgEllipse5 from "./assets/imgEllipse5.svg";
import imgEllipse6 from "./assets/imgEllipse6.svg";
import imgEllipse9 from "./assets/imgEllipse9.svg";
import imgGroup from "./assets/imgGroup.svg";
import imgGroup1 from "./assets/imgGroup1.svg";
import imgGroup2 from "./assets/imgGroup2.svg";
import imgGroup3 from "./assets/imgGroup3.svg";
import imgGroup4 from "./assets/imgGroup4.svg";
import imgVector2 from "./assets/imgVector2.svg";
import imgFrame15 from "./assets/imgFrame15.svg";
import imgFrame16 from "./assets/imgFrame16.svg";
import imgFrame17 from "./assets/imgFrame17.svg";
import imgEllipse from "./assets/imgEllipse.svg";
import imgMenu from "./assets/imgMenu.svg";
import imgVectorStroke from "./assets/imgVectorStroke.svg";
import imgLike from "./assets/imgLike.svg";
import imgComment from "./assets/imgComment.svg";
import imgShare from "./assets/imgShare.svg";
import imgMenu1 from "./assets/imgMenu1.svg";
import imgEllipse8 from "./assets/imgEllipse8.svg";
import imgRectangle15 from "./assets/imgRectangle15.svg";
import imgMenu2 from "./assets/imgMenu2.svg";
import imgRectangle14 from "./assets/imgRectangle14.svg";
import imgVector from "./assets/imgVector.svg";
import imgGroup5 from "./assets/imgGroup5.svg";
import imgEllipse10 from "./assets/imgEllipse10.svg";
import imgEllipse11 from "./assets/imgEllipse11.svg";
import imgEarth from "./assets/imgEarth.svg";
import imgStation from "./assets/imgStation.svg";
import imgGroup170 from "./assets/imgGroup170.svg";
import imgGroup171 from "./assets/imgGroup171.svg";
import imgNavy from "./assets/imgNavy.svg";
import imgBlue from "./assets/imgBlue.svg";
import imgSky from "./assets/imgSky.svg";
import imgPaper from "./assets/imgPaper.svg";
import imgSage from "./assets/imgSage.svg";
import imgMoss from "./assets/imgMoss.svg";
import imgTeal from "./assets/imgTeal.svg";
import imgSand from "./assets/imgSand.svg";
import imgBrown from "./assets/imgBrown.svg";
import imgMark from "./assets/imgMark.svg";
const today = [
  "ממוסחר",
  "שטחי",
  "מניפולטיבי",
  "מציף",
  "ממוקד סיפוק מיידי",
  "תחרותי",
];
const proposed = ["מעורר השראה", "מסקרן", "חינוכי", "מדעי", "מעשיר", "חוויתי"];
const steps = [
  ["שואלים", "השאלה ממלאת את המסך, בין שתי נקודות."],
  ["מתחברים", "הנקודות מתחברות בקו, והנקודה חוזרת וחושפת את הסרטון."],
  ["עונים", "האסטרונאוט עונה, והשאלה נשארת למעלה כתגית."],
];
const palette = [
  ["Navy", "#071131", imgNavy],
  ["Blue", "#04498C", imgBlue],
  ["Sky", "#BDE3FF", imgSky],
  ["Paper", "#FBF9F5", imgPaper],
  ["Sage", "#C2D1BF", imgSage],
  ["Moss", "#7C9577", imgMoss],
  ["Teal", "#76A9AF", imgTeal],
  ["Sand", "#BAA27E", imgSand],
  ["Brown", "#75503C", imgBrown],
];
function Brand({ small = false }: { small?: boolean }) {
  return (
    <div
      className={small ? styles.brandSmall : styles.brand}
      dir="ltr"
      lang="en"
    >
      {small ? (
        <span className={styles.smallMark}>
          <img src={imgEllipse10} alt="" />
          <img src={imgEllipse11} alt="" />
        </span>
      ) : (
        <img src={imgGroup15} alt="" />
      )}
      <span>Copy That</span>
    </div>
  );
}
function PhoneFrame({
  variant,
  children,
}: {
  variant: "question" | "answer" | "form";
  children: ReactNode;
}) {
  return (
    <div className={styles.phoneSlot}>
      <div className={`${styles.phone} ${styles[variant]}`} dir="ltr" lang="en">
        <div className={styles.phoneIsland} />
        <div className={styles.phoneStatus}>
          <span>9:41</span>
          <span>ISS</span>
        </div>
        {children}
        <img
          className={styles.phoneMenu}
          src={
            variant === "question"
              ? imgMenu
              : variant === "answer"
                ? imgMenu1
                : imgMenu2
          }
          alt=""
        />
      </div>
    </div>
  );
}
function Question({ answer = false }: { answer?: boolean }) {
  return (
    <>
      <div className={styles.questionText}>
        What happens to an egg that breaks in space?
      </div>
      <span className={styles.bryan}>Bryan, 17</span>
      {answer && (
        <>
          <img
            className={styles.videoPhoto}
            src={imgEllipse7}
            alt="אסטרונאוט בתחנת החלל"
          />
          <img className={styles.connection} src={imgVectorStroke} alt="" />
          <img className={styles.connectionDot} src={imgEllipse} alt="" />
          <div className={styles.socialIcons}>
            {[imgLike, imgComment, imgShare].map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
        </>
      )}
      <img className={styles.questionDot} src={imgEllipse} alt="" />
      {!answer && (
        <img className={styles.questionBottomDot} src={imgEllipse} alt="" />
      )}
    </>
  );
}
export default function DesignPage() {
  return (
    <main className={styles.page} dir="rtl" lang="he">
      <div className={styles.content}>
        <header className={styles.hero}>
          <img className={styles.heroCircle} src={imgEllipse2} alt="" />
          <div className={styles.heroBrand}>
            <Brand />
            <p className={styles.tagline}>פלטפורמת טיקטוק לאסטראונטים</p>
          </div>
        </header>
        <section className={styles.intro} aria-labelledby="design-intro">
          <img className={styles.introCurve} src={imgEllipse4} alt="" />
          <h1 id="design-intro" className={styles.displayTitle}>
            רקע ומטרות
          </h1>
          <p className={styles.introText}>
            חוויית החלל פתוחה למספר מצומצם מאוד של אנשים. ומי שכן שם, נמצא בשהות
            ממושכת שיוצרת ריחוק מהמשפחה, מהחברים ומהיומיום בכדור הארץ.
          </p>
          <div className={styles.comparison}>
            <div className={styles.comparisonGroup}>
              <h2 className={styles.sectionTitle}>
                טיקטוק <span className={styles.gold}>היום</span>
              </h2>
              <div className={styles.bubbleGrid}>
                {today.map((item) => (
                  <div className={styles.bubble} key={item}>
                    <img src={imgEllipse5} alt="" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.comparisonGroup}>
              <h2 className={styles.sectionTitle}>
                מה אנחנו <span className={styles.greenText}>מציעים</span>
              </h2>
              <div className={styles.bubbleGrid}>
                {proposed.map((item, index) => (
                  <div
                    className={`${styles.bubble} ${styles.lightBubble}`}
                    key={item}
                  >
                    <img src={index === 0 ? imgEllipse6 : imgEllipse9} alt="" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className={styles.audience} aria-labelledby="design-audience">
          <div className={styles.audienceHeading}>
            <img src={imgEllipse3} alt="" />
            <h2 id="design-audience" className={styles.displayTitle}>
              קהל יעד
            </h2>
          </div>
          <div className={styles.audienceCards}>
            <article className={`${styles.audienceCircle} ${styles.astronaut}`}>
              <div className={styles.audienceCopy}>
                <img src={imgGroup} alt="" />
                <h3 className={styles.sectionTitle}>אסטרונאוטים בזמן משימה</h3>
                <p className={styles.bodyText}>
                  ירגישו משמעותיים ומשפיעים דרך שיתוף הידע והניסיון שלהם.
                </p>
              </div>
            </article>
            <div className={styles.orbitSymbol} aria-hidden="true">
              <img
                className={styles.orbitMain}
                src={imgGroup3}
                alt=""
                style={{ maskImage: `url(${imgGroup2})` }}
              />
              <img className={styles.orbitDetail} src={imgGroup4} alt="" />
              <img className={styles.orbitLine} src={imgVector2} alt="" />
            </div>
            <article className={`${styles.audienceCircle} ${styles.earth}`}>
              <div className={styles.audienceCopy}>
                <img src={imgGroup1} alt="" />
                <h3 className={styles.sectionTitle}>
                  חובבי חלל, תלמידים, משפחות וחברים
                </h3>
                <p className={styles.bodyText}>
                  לספק את הסקרנות ולהפוך את זמן המסך לחוויה מעשירה, מעוררת השראה
                  ובעלת ערך.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section className={styles.features} aria-labelledby="design-features">
          <h2 id="design-features" className={styles.sectionTitle}>
            מה אנחנו בונים?
          </h2>
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <img src={imgFrame15} alt="" />
              <p className={styles.bodyText}>פלטפורמה חינוכית</p>
            </div>
            <div className={styles.feature}>
              <img src={imgFrame16} alt="" />
              <p className={styles.bodyText}>שאלות / תשובות</p>
            </div>
            <div className={styles.feature}>
              <img src={imgFrame17} alt="" />
              <p className={styles.bodyText}>
                התחשבות בתנאים בחלל בעזרת ״מצב מאוזן״ ופעולות קוליות
              </p>
            </div>
          </div>
        </section>
        <section className={styles.flow} aria-labelledby="design-flow">
          <h2 id="design-flow" className={styles.sectionTitle}>
            הפלואו, בקצרה
          </h2>
          <div className={styles.flowLayout}>
            <div className={styles.flowTop}>
              <div className={styles.questionExample}>
                <p className={styles.desktopCaption}>
                  <span className={styles.stepNumber}>1</span>שואלים
                </p>
                <PhoneFrame variant="question">
                  <Question />
                </PhoneFrame>
              </div>
              <ol className={styles.steps}>
                {steps.map(([title, description], index) => (
                  <li className={styles.step} key={title}>
                    <h3 className={styles.stepTitle}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      {title}
                    </h3>
                    <p className={styles.bodyText}>{description}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className={styles.flowBottom}>
              <figure className={styles.phoneExample}>
                <figcaption className={styles.bodyText}>
                  <span
                    className={styles.desktopStepNumbers}
                    aria-label="שלבים 2 ו־3"
                  >
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepNumber}>3</span>
                  </span>
                  חשיפת תשובה
                </figcaption>
                <PhoneFrame variant="answer">
                  <Question answer />
                </PhoneFrame>
              </figure>
              <figure className={styles.phoneExample}>
                <figcaption className={styles.bodyText}>שאילת שאלה</figcaption>
                <PhoneFrame variant="form">
                  <img className={styles.formCircle} src={imgEllipse8} alt="" />
                  <Brand small />
                  <div className={styles.formQuestion}>
                    Type your question...<span className={styles.caret}>|</span>
                  </div>
                  <div className={styles.formFields}>
                    {["Name...", "Age...", "Location..."].map((label) => (
                      <div key={label}>
                        <img src={imgRectangle15} alt="" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.launch}>
                    <img src={imgRectangle14} alt="" />
                    <img
                      className={styles.launchThumb}
                      src={imgVector}
                      alt=""
                    />
                    <img
                      className={styles.launchArrow}
                      src={imgGroup5}
                      alt=""
                    />
                    <span>Slide to launch</span>
                  </div>
                </PhoneFrame>
              </figure>
            </div>
          </div>
        </section>
        <section
          className={styles.visualLanguage}
          aria-labelledby="design-language"
        >
          <h2 id="design-language" className={styles.sectionTitle}>
            שפה גרפית
          </h2>
          <p className={styles.bodyText}>
            ההשראה הגיעה מהקונספט של חיבור בין עולמות, ומהפלואידיות של המיתוג
            הישן של נאס״א.
          </p>
          <div className={styles.diagramSlot}>
            <div className={styles.visualDiagram}>
              <img className={styles.diagramBigCircle} src={imgEarth} alt="" />
              <img
                className={styles.diagramSmallCircle}
                src={imgStation}
                alt=""
              />
              <span className={styles.diagramSpace}>כוכב / תחנת החלל</span>
              <span className={styles.diagramEarth}>כדור הארץ</span>
              <span className={styles.diagramCamera}>
                ובדרך רומז גם על
                <br />
                עדשה ופלאש של מצלמה
              </span>
              <img className={styles.spaceArrow} src={imgGroup170} alt="" />
              <img className={styles.earthArrow} src={imgGroup171} alt="" />
            </div>
          </div>
          <div className={styles.languageDetails}>
            <div className={styles.palette} aria-label="צבעי המותג">
              {palette.map(([name, color, src]) => (
                <img
                  key={name}
                  src={src}
                  alt={`${name} ${color}`}
                  title={color}
                />
              ))}
            </div>
            <div className={styles.typography}>
              <div>
                <span>לוגו</span>
                <strong className={styles.museo} dir="ltr" lang="en">
                  MuseoModerno
                </strong>
              </div>
              <div>
                <span>כותרות באנגלית</span>
                <strong className={styles.alatsi} dir="ltr" lang="en">
                  Alatsi
                </strong>
              </div>
              <div>
                <span>כותרות בעברית</span>
                <strong dir="ltr" lang="en">
                  Tel Aviv Modernist
                </strong>
              </div>
              <div>
                <span>טקסט רץ</span>
                <strong dir="ltr" lang="en">
                  TheBasics
                </strong>
              </div>
            </div>
          </div>
        </section>
        <footer className={styles.footer}>
          <img className={styles.footerCircle} src={imgEllipse1} alt="" />
          <img className={styles.footerMark} src={imgMark} alt="" />
          <h2 className={styles.displayTitle}>תודה רבה!</h2>
        </footer>
      </div>
    </main>
  );
}
