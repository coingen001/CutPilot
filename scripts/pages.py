# Genera tutte le pagine HTML del sito (home, strumenti per materiale, prezzi, note legali, privacy)
# nelle quattro lingue. Uso, dalla cartella del progetto:  python3 scripts/pages.py
import json

NAV = '<a href="../de/"{de}>DE</a><a href="../it/"{it}>IT</a><a href="../en-us/"{en}>EN</a><a href="../fr/"{fr}>FR</a>'
def nav(lang=None):
    return NAV.format(**{k: (' aria-current="page"' if l == lang else '') for k,l in (('de','de'),('it','it'),('en','en-us'),('fr','fr'))})
HEAD = '''<!doctype html>
<html lang="{htmllang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content="{desc}" />
    <meta name="theme-color" content="#095441" />
    <link rel="icon" type="image/png" href="../src/assets/icon.png" />
  </head>
  <body>
    <header class="site">
      <a class="brand" href="./"><img src="../src/assets/logo.png" alt="CutPilot" width="180" height="50" /></a>
      <nav aria-label="{langnav}">{nav}</nav>
    </header>
'''
FOOT = '''    <footer class="site">
      <img src="../src/assets/logo-white.png" alt="CutPilot" width="150" height="42" />
      <p>{foot}</p>
      <nav class="legal"><a href="./{price_file}">{price_name}</a><a href="./{legal_file}">{legal_name}</a><a href="./{priv_file}">{priv_name}</a></nav>
    </footer>
    <script type="module" src="../src/{script}"></script>
  </body>
</html>
'''
HOME = '''    <main>
      <section class="hero">
        <div class="hero-text">
          <h1>{h1}</h1>
          <p class="lead">{lead}</p>
          <div class="cta">
            <a class="btn primary" href="#tool">{cta1}</a>
            <button class="btn" data-hero-example>{cta2}</button>
          </div>
          <ul class="facts">{facts}</ul>
        </div>
        <figure class="hero-figure">
          <div id="hero-figure"></div>
          <figcaption>{caption}</figcaption>
        </figure>
      </section>
      <section id="tool" class="tool">
        <h2>{toolh}</h2>
        <div id="app" data-preset='{preset}' data-pricing="./{price_file}"></div>
      </section>
      <section class="explain">
        <h2>{exh}</h2>
        <dl>{ex}</dl>
      </section>
{more}    </main>
'''
TEXT = '''    <main>
      <section class="text">
        <h1>{h}</h1>
{body}
      </section>
    </main>
'''
li = lambda xs: ''.join(f'<li>{x}</li>' for x in xs)
dl = lambda xs: ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a,b in xs)
def body(blocks):
    out=[]
    for h,ps in blocks:
        if h: out.append(f'        <h2>{h}</h2>')
        out += [f'        <p>{p}</p>' for p in ps]
    return '\n'.join(out)
WHO = 'Luca Marzotto<br />Via Cosmo Cosmi, 20<br />42020 Albinea (RE), {country}'
MAIL = '<a href="mailto:info@lucamarzotto.it">info@lucamarzotto.it</a>'

L = {}
L['de'] = dict(langnav='Sprache',
  title='Zuschnittoptimierung online für Platten und Stangen | CutPilot',
  desc='Zuschnitt für Platten und Stangen kostenlos optimieren: Sägeblattstärke, Besäumschnitt und Maserung berücksichtigt, Schnittplan zum Ausdrucken.',
  h1='Weniger Verschnitt, Schnittplan in Sekunden',
  lead='Zuschnittliste eingeben oder aus Excel importieren. CutPilot verteilt die Teile auf Platten und Stangen und zeigt, wie viel Material Sie wirklich brauchen.',
  cta1='Zuschnittliste eingeben', cta2='Beispiel ansehen',
  facts=li(['Kostenlos und ohne Anmeldung','Ihre Daten bleiben im Browser','Import aus Excel und CSV']),
  caption='Ein echter Schnittplan: Kleiderschrank mit 13 Teilen, Platte 1 von 2.',
  toolh='Ihr Zuschnitt', exh='Was der Schnittplan berücksichtigt',
  ex=dl([('Sägeblattstärke','Jeder Schnitt kostet Material. Zwischen zwei Teilen bleibt immer die Breite des Sägeblatts frei.'),
         ('Besäumschnitt','Beschädigte Plattenkanten werden vorab abgezogen, damit jedes Teil aus sauberem Material kommt.'),
         ('Maserung','Bei Dekorplatten legen Sie pro Teil fest, ob es gedreht werden darf.'),
         ('Durchgehende Schnitte','Alle Schnitte laufen von Kante zu Kante, passend für Formatkreissäge und Plattenaufteilsäge.')]),
  foot='Vorschauversion. Ihre Zuschnittliste wird nur in Ihrem Browser verarbeitet und nicht übertragen.',
  legal_file='impressum.html', legal_name='Impressum', priv_file='datenschutz.html', priv_name='Datenschutz',
  legal=[('Anbieter', [WHO.format(country='Italien')]),
    ('Kontakt', [f'E-Mail: {MAIL}<br />Telefon: +39 347 8741794']),
    ('Unternehmensangaben', ['Umsatzsteuer-Identifikationsnummer: IT02955670357<br />Eingetragen im Handelsregister Reggio Emilia, REA RE-327826']),
    ('Haftung für die Ergebnisse', ['CutPilot ist eine Rechenhilfe. Die Schnittpläne werden automatisch berechnet und sind vor dem Zuschnitt zu prüfen. Für Materialverluste aus fehlerhaften Eingaben oder ungeprüften Plänen übernehmen wir keine Haftung.'])],
  priv=[('Verantwortlicher', [WHO.format(country='Italien'), f'E-Mail: {MAIL}']),
    ('Ihre Zuschnittliste', ['Maße, Bezeichnungen und Einstellungen werden ausschließlich in Ihrem Browser verarbeitet. Sie werden nicht an uns oder an Dritte übertragen.', 'Damit Ihre letzte Liste beim nächsten Besuch wieder da ist, speichert der Browser sie lokal auf Ihrem Gerät. Sie löschen sie mit „Liste leeren“ oder über die Website-Daten Ihres Browsers.']),
    ('Keine Cookies, anonyme Zählung', ['Diese Website setzt keine Cookies, nutzt keine Analyse- oder Werbedienste von Drittanbietern und lädt keine fremden Schriften oder Skripte. Es gibt keine Benutzerkonten.', 'Wir zählen selbst, wie oft Seiten aufgerufen und Funktionen genutzt werden (zum Beispiel eine Berechnung). Gespeichert werden nur Datum, Seite und Art der Aktion, keine IP-Adresse und keine Kennung. Besucher lassen sich damit nicht wiedererkennen.']),
    ('Hosting', ['Die Website wird von Netlify, Inc. (USA) ausgeliefert. Beim Aufruf verarbeitet Netlify technische Zugriffsdaten wie IP-Adresse, Zeitpunkt und Browsertyp, um die Seite auszuliefern und abzusichern. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Eine Verarbeitung in den USA erfolgt mit den von der DSGVO vorgesehenen Garantien.']),
    ('Warteliste für PRO und Business', ['Wenn Sie sich auf der Preisseite eintragen, speichern wir Ihre E-Mail-Adresse und den gewählten Plan über den Formulardienst unseres Hosting-Anbieters Netlify. Wir verwenden sie nur, um Sie zu informieren, sobald der Plan verfügbar ist. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO); Sie können sie jederzeit per E-Mail widerrufen.']),
    ('Kontakt per E-Mail', ['Wenn Sie uns schreiben, verwenden wir Ihre Angaben nur, um Ihre Anfrage zu beantworten.']),
    ('Ihre Rechte', ['Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Widerspruch sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Schreiben Sie uns dazu an die oben genannte Adresse.']),
    (None, ['Stand: November 2026'])],
  legal_h='Impressum', priv_h='Datenschutzerklärung')
L['it'] = dict(langnav='Lingua',
  title='Ottimizzazione taglio pannelli e barre online | CutPilot',
  desc='Ottimizza gratis il taglio di pannelli e barre: spessore lama, rifilo e venatura inclusi, schema di taglio da stampare.',
  h1='Meno sfrido, schema di taglio in pochi secondi',
  lead='Inserisci la distinta di taglio o importala da Excel. CutPilot distribuisce i pezzi su pannelli e barre e ti dice quanto materiale serve davvero.',
  cta1='Inserisci la distinta', cta2='Guarda un esempio',
  facts=li(['Gratis e senza registrazione','I tuoi dati restano nel browser','Import da Excel e CSV']),
  caption='Uno schema vero: armadio da 13 pezzi, pannello 1 di 2.',
  toolh='Il tuo taglio', exh='Di cosa tiene conto lo schema',
  ex=dl([('Spessore lama','Ogni taglio consuma materiale. Tra due pezzi resta sempre libera la larghezza della lama.'),
         ('Rifilo','I bordi rovinati del pannello vengono tolti prima, così ogni pezzo esce da materiale pulito.'),
         ('Venatura','Sui pannelli decorativi scegli pezzo per pezzo se può essere ruotato.'),
         ('Tagli passanti','Tutti i tagli vanno da bordo a bordo, adatti a squadratrice e sezionatrice.')]),
  foot='Versione di anteprima. La distinta viene elaborata solo nel tuo browser e non viene inviata.',
  legal_file='note-legali.html', legal_name='Note legali', priv_file='privacy.html', priv_name='Privacy',
  legal=[('Titolare del sito', [WHO.format(country='Italia')]),
    ('Contatti', [f'Email: {MAIL}<br />Telefono: +39 347 8741794']),
    ('Dati fiscali', ['Partita IVA: IT02955670357<br />Codice fiscale: MRZLCU81H22F382H<br />Registro Imprese di Reggio Emilia, REA RE-327826']),
    ('Responsabilità sui risultati', ['CutPilot è uno strumento di calcolo. Gli schemi di taglio sono generati in automatico e vanno verificati prima di tagliare. Non rispondiamo di perdite di materiale dovute a dati inseriti in modo errato o a schemi non controllati.'])],
  priv=[('Titolare del trattamento', [WHO.format(country='Italia'), f'Email: {MAIL}']),
    ('La tua distinta di taglio', ['Misure, descrizioni e impostazioni vengono elaborate soltanto nel tuo browser. Non vengono inviate a noi né a terzi.', 'Per farti ritrovare l’ultima distinta alla visita successiva, il browser la salva in locale sul tuo dispositivo. Puoi cancellarla con «Svuota distinta» o dai dati dei siti del browser.']),
    ('Niente cookie, conteggio anonimo', ['Questo sito non usa cookie, non usa servizi di analisi o pubblicità di terze parti e non carica caratteri o script esterni. Non esistono account utente.', 'Contiamo noi quante volte le pagine vengono aperte e le funzioni usate (per esempio un calcolo). Salviamo solo data, pagina e tipo di azione, senza indirizzo IP e senza identificativi: non è possibile riconoscere chi visita.']),
    ('Hosting', ['Il sito è distribuito da Netlify, Inc. (USA). Quando apri una pagina, Netlify tratta dati tecnici di accesso come indirizzo IP, data e ora e tipo di browser, per mostrare il sito e proteggerlo. La base giuridica è il nostro legittimo interesse a un servizio sicuro (art. 6, par. 1, lett. f GDPR). L’eventuale trattamento negli Stati Uniti avviene con le garanzie previste dal GDPR.']),
    ('Lista d’attesa per PRO e Business', ['Se ti iscrivi dalla pagina prezzi, salviamo il tuo indirizzo email e il piano scelto tramite il servizio moduli del nostro fornitore di hosting Netlify. Li usiamo solo per avvisarti quando il piano è disponibile. La base giuridica è il tuo consenso (art. 6, par. 1, lett. a GDPR), che puoi revocare in ogni momento scrivendoci.']),
    ('Contatti via email', ['Se ci scrivi, usiamo i tuoi dati solo per risponderti.']),
    ('I tuoi diritti', ['Hai diritto di accesso, rettifica, cancellazione, limitazione e opposizione, e puoi presentare reclamo al Garante per la protezione dei dati personali. Per esercitarli scrivi all’indirizzo indicato sopra.']),
    (None, ['Ultimo aggiornamento: novembre 2026'])],
  legal_h='Note legali', priv_h='Informativa sulla privacy')
L['en-us'] = dict(langnav='Language',
  title='Cut list optimizer for plywood sheets and lumber | CutPilot',
  desc='Optimize sheet and lumber cutting for free, in inches: blade kerf, edge trim and grain direction included, printable cutting diagram.',
  h1='Less waste, a cutting plan in seconds',
  lead='Type in your cut list or import it from Excel. CutPilot lays the parts out on panels and bars and shows how much material you really need.',
  cta1='Enter your cut list', cta2='See an example',
  facts=li(['Free, no sign-up','Your data stays in your browser','Import from Excel and CSV']),
  caption='A real cutting plan: a 13-part wardrobe on 4 × 8 ft sheets.',
  toolh='Your cut', exh='What the cutting plan accounts for',
  ex=dl([('Blade kerf','Every cut uses up material. The kerf of the blade always stays free between two parts.'),
         ('Edge trim','Damaged panel edges are removed first, so every part comes from clean material.'),
         ('Grain direction','On decorative panels you decide part by part whether it may be rotated.'),
         ('Through cuts','Every cut runs edge to edge, as panel saws and sliding table saws require.')]),
  foot='Preview version. Your cut list is processed only in your browser and is never sent anywhere.',
  legal_file='legal-notice.html', legal_name='Legal notice', priv_file='privacy.html', priv_name='Privacy',
  legal=[('Site owner', [WHO.format(country='Italy')]),
    ('Contact', [f'Email: {MAIL}<br />Phone: +39 347 8741794']),
    ('Company details', ['VAT number: IT02955670357<br />Registered with the Reggio Emilia Companies Register, REA RE-327826']),
    ('Liability for results', ['CutPilot is a calculation aid. Cutting plans are generated automatically and must be checked before cutting. We accept no liability for material lost through incorrect input or unchecked plans.'])],
  priv=[('Data controller', [WHO.format(country='Italy'), f'Email: {MAIL}']),
    ('Your cut list', ['Dimensions, descriptions and settings are processed only in your browser. They are not sent to us or to third parties.', 'So that your last list is there on your next visit, the browser stores it locally on your device. Delete it with “Clear list” or from your browser’s site data.']),
    ('No cookies, anonymous counting', ['This site sets no cookies, uses no third-party analytics or advertising services and loads no outside fonts or scripts. There are no user accounts.', 'We count for ourselves how often pages are opened and features are used (a calculation, for example). Only the date, the page and the kind of action are stored, with no IP address and no identifier, so visitors cannot be recognized.']),
    ('Hosting', ['The site is delivered by Netlify, Inc. (USA). When you open a page, Netlify processes technical access data such as IP address, time and browser type in order to deliver and secure the site. The legal basis is our legitimate interest in a secure service (Art. 6(1)(f) GDPR). Any processing in the United States takes place under the safeguards the GDPR provides.']),
    ('Waitlist for PRO and Business', ['If you sign up on the pricing page, we store your email address and the plan you chose through the form service of our hosting provider Netlify. We use them only to let you know when the plan is available. The legal basis is your consent (Art. 6(1)(a) GDPR), which you can withdraw at any time by emailing us.']),
    ('Contact by email', ['If you write to us, we use your details only to reply.']),
    ('Your rights', ['You have the right to access, rectification, erasure, restriction and objection, and the right to lodge a complaint with a data protection authority. To exercise them, write to the address above.']),
    (None, ['Last updated: November 2026'])],
  legal_h='Legal notice', priv_h='Privacy policy')
L['fr'] = dict(langnav='Langue',
  title='Optimisation de découpe de panneaux et barres en ligne | CutPilot',
  desc='Optimisez gratuitement la découpe de panneaux et de barres : épaisseur de lame, délignage et sens du fil pris en compte, plan de coupe à imprimer.',
  h1='Moins de chutes, un plan de coupe en quelques secondes',
  lead='Saisissez votre liste de débit ou importez-la depuis Excel. CutPilot répartit les pièces sur les panneaux et les barres et indique la quantité de matériau réellement nécessaire.',
  cta1='Saisir la liste de débit', cta2='Voir un exemple',
  facts=li(['Gratuit et sans inscription','Vos données restent dans le navigateur','Import depuis Excel et CSV']),
  caption='Un vrai plan de coupe : armoire de 13 pièces, panneau 1 sur 2.',
  toolh='Votre découpe', exh='Ce que le plan de coupe prend en compte',
  ex=dl([('Épaisseur de lame','Chaque coupe consomme du matériau. La largeur de la lame reste toujours libre entre deux pièces.'),
         ('Délignage','Les bords abîmés du panneau sont retirés d’abord, pour que chaque pièce sorte d’un matériau propre.'),
         ('Sens du fil','Sur les panneaux décoratifs, vous choisissez pièce par pièce si elle peut être tournée.'),
         ('Coupes traversantes','Toutes les coupes vont d’un bord à l’autre, comme l’exigent les scies à format et à panneaux.')]),
  foot='Version d’aperçu. Votre liste de débit est traitée uniquement dans votre navigateur et n’est jamais transmise.',
  legal_file='mentions-legales.html', legal_name='Mentions légales', priv_file='confidentialite.html', priv_name='Confidentialité',
  legal=[('Éditeur du site', [WHO.format(country='Italie')]),
    ('Contact', [f'E-mail : {MAIL}<br />Téléphone : +39 347 8741794']),
    ('Informations sur l’entreprise', ['Numéro de TVA : IT02955670357<br />Inscrit au Registre des entreprises de Reggio Emilia, REA RE-327826']),
    ('Hébergeur', ['Netlify, Inc., San Francisco, États-Unis.']),
    ('Responsabilité quant aux résultats', ['CutPilot est une aide au calcul. Les plans de coupe sont générés automatiquement et doivent être vérifiés avant la découpe. Nous déclinons toute responsabilité pour les pertes de matériau dues à une saisie erronée ou à des plans non vérifiés.'])],
  priv=[('Responsable du traitement', [WHO.format(country='Italie'), f'E-mail : {MAIL}']),
    ('Votre liste de débit', ['Les dimensions, désignations et réglages sont traités uniquement dans votre navigateur. Ils ne sont transmis ni à nous ni à des tiers.', 'Pour que vous retrouviez votre dernière liste à la visite suivante, le navigateur l’enregistre localement sur votre appareil. Supprimez-la avec « Vider la liste » ou depuis les données de site de votre navigateur.']),
    ('Pas de cookies, comptage anonyme', ['Ce site ne dépose aucun cookie, n’utilise aucun service tiers d’analyse ou de publicité et ne charge ni polices ni scripts externes. Il n’existe pas de compte utilisateur.', 'Nous comptons nous-mêmes combien de fois les pages sont ouvertes et les fonctions utilisées (un calcul, par exemple). Seuls la date, la page et le type d’action sont enregistrés, sans adresse IP ni identifiant : les visiteurs ne peuvent pas être reconnus.']),
    ('Hébergement', ['Le site est diffusé par Netlify, Inc. (États-Unis). Lorsque vous ouvrez une page, Netlify traite des données techniques d’accès telles que l’adresse IP, l’heure et le type de navigateur, afin d’afficher le site et de le sécuriser. La base légale est notre intérêt légitime à un service sûr (art. 6, par. 1, point f du RGPD). Un éventuel traitement aux États-Unis s’effectue avec les garanties prévues par le RGPD.']),
    ('Liste d’attente pour PRO et Business', ['Si vous vous inscrivez depuis la page des tarifs, nous enregistrons votre adresse e-mail et l’offre choisie via le service de formulaires de notre hébergeur Netlify. Nous les utilisons uniquement pour vous prévenir lorsque l’offre est disponible. La base légale est votre consentement (art. 6, par. 1, point a du RGPD), que vous pouvez retirer à tout moment en nous écrivant.']),
    ('Contact par e-mail', ['Si vous nous écrivez, nous utilisons vos données uniquement pour vous répondre.']),
    ('Vos droits', ['Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’opposition, ainsi que du droit d’introduire une réclamation auprès d’une autorité de protection des données. Pour les exercer, écrivez à l’adresse ci-dessus.']),
    (None, ['Dernière mise à jour : novembre 2026'])],
  legal_h='Mentions légales', priv_h='Politique de confidentialité')

# ---- Strumenti per materiale: stessa applicazione, valori iniziali e testi propri ----
MM = {'waste': {}, 'mdf': {'sheet': {'stockLength': 2800, 'stockWidth': 2070, 'kerf': 3.2, 'trim': 10, 'grain': False}},
      'plywood': {'sheet': {'stockLength': 2500, 'stockWidth': 1250, 'kerf': 3.2, 'trim': 5, 'grain': True}},
      'alu': {'mode': '1d', 'bar': {'stockLength': 6000, 'kerf': 4, 'trim': 20}},
      'tube': {'mode': '1d', 'bar': {'stockLength': 6000, 'kerf': 2, 'trim': 0}},
      'glass': {'sheet': {'stockLength': 3210, 'stockWidth': 2250, 'kerf': 0, 'trim': 15, 'grain': False}}}
IN = {'waste': {}, 'mdf': {'sheet': {'stockLength': 97, 'stockWidth': 49, 'kerf': 0.125, 'trim': 0.5, 'grain': False}},
      'plywood': {'sheet': {'stockLength': 96, 'stockWidth': 48, 'kerf': 0.125, 'trim': 0, 'grain': True}},
      'alu': {'mode': '1d', 'bar': {'stockLength': 240, 'kerf': 0.125, 'trim': 1}},
      'tube': {'mode': '1d', 'bar': {'stockLength': 240, 'kerf': 0.0625, 'trim': 0}},
      'glass': {'sheet': {'stockLength': 130, 'stockWidth': 96, 'kerf': 0, 'trim': 0.5, 'grain': False}}}
# per ogni strumento: file, nome nel menu, titolo, sommario, (voce, spiegazione)
TOOLS = {
 'de': dict(more='Rechner für jedes Material', home='Platten und Stangen', tools={
  'waste': ('verschnittrechner.html','Verschnittrechner','Verschnitt berechnen, bevor Sie Material bestellen','Zuschnittliste eingeben und sofort sehen, wie viele Platten Sie brauchen und wie viel Prozent davon Verschnitt sind.',('Wie der Verschnitt berechnet wird','Verschnitt ist die Plattenfläche abzüglich der Fläche aller Teile. Sägeschnitte und Besäumschnitt zählen dazu, weil dieses Material verloren ist.')),
  'mdf': ('mdf-zuschnitt.html','MDF-Zuschnitt','MDF-Platten zuschneiden mit wenig Verschnitt','Voreingestellt auf das gängige Format 2800 × 2070 mm. MDF hat keine Maserung, deshalb dürfen alle Teile gedreht werden.',('Warum Drehen bei MDF hilft','Ohne Maserung kann jedes Teil längs oder quer liegen. Das bringt oft eine ganze Platte Ersparnis.')),
  'plywood': ('sperrholz-zuschnitt.html','Sperrholz-Zuschnitt','Sperrholz zuschneiden mit Rücksicht auf die Maserung','Voreingestellt auf 2500 × 1250 mm mit Maserung. Legen Sie pro Teil fest, ob es gedreht werden darf.',('Maserung beim Sperrholz','Sichtbare Teile sollen in Faserrichtung liegen. Teile im Korpusinneren dürfen Sie zum Drehen freigeben.')),
  'alu': ('aluprofile-zuschnitt.html','Aluprofile','Aluprofile ablängen mit wenig Reststücken','Stangen von 6 m, Sägeblatt 4 mm und Anschnitt am Stangenanfang sind voreingestellt. Längen und Stückzahlen eingeben, fertig.',('Anschnitt','Das Stangenende ist oft nicht winklig. Der Anschnitt wird vor dem ersten Teil abgezogen.')),
  'tube': ('rohre-zuschnitt.html','Rohre und Stahlprofile','Rohre und Stahlprofile ablängen','Für Stahlrohre, Vierkantrohre und Flachstahl in Stangen von 6 m. Der Schnittplan zeigt pro Stange die Reihenfolge und das Reststück.',('Reststücke','Für jede Stange sehen Sie das verbleibende Reststück, damit Sie es beim nächsten Auftrag wieder einplanen können.')),
  'glass': ('glas-zuschnitt.html','Glaszuschnitt','Glas zuschneiden mit durchgehenden Schnitten','Voreingestellt auf Tafeln von 3210 × 2250 mm ohne Schnittbreite. Alle Schnitte laufen von Kante zu Kante, wie es beim Ritzen und Brechen nötig ist.',('Durchgehende Schnitte bei Glas','Glas lässt sich nur entlang einer durchgehenden Linie brechen. Der Plan enthält deshalb keine Schnitte, die mitten in der Tafel enden.'))}),
 'it': dict(more='Uno strumento per ogni materiale', home='Pannelli e barre', tools={
  'waste': ('calcolo-sfrido.html','Calcolo dello sfrido','Calcola lo sfrido prima di ordinare il materiale','Inserisci la distinta e vedi subito quanti pannelli servono e che percentuale diventa sfrido.',('Come si calcola lo sfrido','Lo sfrido è la superficie dei pannelli meno quella dei pezzi. Tagli e rifilo ne fanno parte, perché quel materiale è perso.')),
  'mdf': ('taglio-mdf.html','Taglio MDF','Taglio di pannelli MDF con poco sfrido','Preimpostato sul formato comune 2800 × 2070 mm. L’MDF non ha venatura, quindi tutti i pezzi possono essere ruotati.',('Perché ruotare aiuta','Senza venatura ogni pezzo può stare per lungo o per traverso. Spesso si risparmia un pannello intero.')),
  'plywood': ('taglio-compensato.html','Taglio compensato','Taglio del compensato rispettando la venatura','Preimpostato su 2500 × 1250 mm con venatura. Scegli pezzo per pezzo se può essere ruotato.',('La venatura nel compensato','I pezzi a vista vanno nel senso della fibra. Quelli interni al mobile puoi lasciarli liberi di ruotare.')),
  'alu': ('taglio-profili-alluminio.html','Profili in alluminio','Taglio di profili in alluminio con pochi spezzoni','Barre da 6 m, lama da 4 mm e rifilo a inizio barra già impostati. Inserisci lunghezze e quantità.',('Rifilo iniziale','La testa della barra spesso non è in squadra. Il rifilo viene tolto prima del primo pezzo.')),
  'tube': ('taglio-tubi.html','Tubi e profilati in ferro','Taglio di tubi e profilati in ferro','Per tubi tondi, tubolari quadri e piatti in barre da 6 m. Lo schema mostra per ogni barra la sequenza e lo spezzone che resta.',('Spezzoni','Per ogni barra vedi lo spezzone avanzato, così lo riusi nella commessa successiva.')),
  'glass': ('taglio-vetro.html','Taglio vetro','Taglio del vetro con tagli passanti','Preimpostato su lastre da 3210 × 2250 mm senza spessore di taglio. Tutti i tagli vanno da bordo a bordo, come serve per incidere e troncare.',('Tagli passanti nel vetro','Il vetro si tronca solo lungo una linea continua. Lo schema non contiene tagli che finiscono a metà lastra.'))}),
 'en-us': dict(more='A calculator for every material', home='Sheets and lumber', tools={
  'waste': ('waste-calculator.html','Waste calculator','Work out your waste before you order material','Enter your cut list and see right away how many sheets you need and what share of them ends up as waste.',('How waste is calculated','Waste is the sheet area minus the area of all parts. Saw kerfs and edge trim count as waste, because that material is gone.')),
  'mdf': ('mdf-cut-optimizer.html','MDF cut optimizer','Cut MDF sheets with less waste','Preset for 49 × 97 in sheets. MDF has no grain, so every part may be rotated.',('Why rotation helps','Without grain, each part can lie lengthwise or crosswise. That often saves a whole sheet.')),
  'plywood': ('plywood-cut-optimizer.html','Plywood cut optimizer','Cut plywood while respecting the grain','Preset for 4 × 8 ft sheets with grain. Decide part by part whether it may be rotated.',('Grain in plywood','Visible parts should follow the face grain. Parts inside the cabinet can be left free to rotate.')),
  'alu': ('aluminum-extrusion-cut-optimizer.html','Aluminum extrusions','Cut aluminum extrusions with fewer leftovers','Preset for 20 ft bars, a 1/8 in kerf and a trim cut at the start of each bar. Enter lengths and quantities.',('Start trim','The end of a bar is often not square. The trim is removed before the first part.')),
  'tube': ('tube-cut-optimizer.html','Tube and steel stock','Cut steel tube and bar stock','For round tube, square tube and flat bar in 20 ft lengths. The plan shows the cutting order and the leftover for every bar.',('Leftovers','For each bar you see the remaining piece, so you can plan it into the next job.')),
  'glass': ('glass-cut-optimizer.html','Glass cut optimizer','Cut glass with edge-to-edge cuts','Preset for 96 × 130 in lites with no kerf. Every cut runs edge to edge, as scoring and breaking require.',('Edge-to-edge cuts in glass','Glass only breaks along a continuous line. The plan contains no cut that stops in the middle of the lite.'))}),
 'fr': dict(more='Un outil pour chaque matériau', home='Panneaux et barres', tools={
  'waste': ('calcul-chutes.html','Calcul des chutes','Calculez vos chutes avant de commander le matériau','Saisissez la liste de débit et voyez tout de suite combien de panneaux il faut et quelle part devient chute.',('Comment les chutes sont calculées','Les chutes sont la surface des panneaux moins celle des pièces. Les traits de scie et le délignage en font partie, car ce matériau est perdu.')),
  'mdf': ('decoupe-mdf.html','Découpe MDF','Découpe de panneaux MDF avec peu de chutes','Préréglé sur le format courant 2800 × 2070 mm. Le MDF n’a pas de fil : toutes les pièces peuvent être tournées.',('Pourquoi tourner les pièces','Sans fil, chaque pièce peut être placée en long ou en travers. On économise souvent un panneau entier.')),
  'plywood': ('decoupe-contreplaque.html','Découpe contreplaqué','Découpe du contreplaqué en respectant le fil','Préréglé sur 2500 × 1250 mm avec fil. Choisissez pièce par pièce si elle peut être tournée.',('Le fil du contreplaqué','Les pièces visibles suivent le sens du fil. Celles à l’intérieur du meuble peuvent rester libres.')),
  'alu': ('decoupe-profiles-aluminium.html','Profilés aluminium','Découpe de profilés aluminium avec peu de chutes','Barres de 6 m, lame de 4 mm et coupe de départ déjà réglées. Saisissez longueurs et quantités.',('Coupe de départ','L’extrémité de la barre est rarement d’équerre. La coupe de départ est retirée avant la première pièce.')),
  'tube': ('decoupe-tubes.html','Tubes et profilés acier','Découpe de tubes et de profilés acier','Pour tubes ronds, tubes carrés et plats en barres de 6 m. Le plan indique pour chaque barre l’ordre de coupe et la chute restante.',('Chutes réutilisables','Pour chaque barre, vous voyez la chute restante, à réutiliser sur la commande suivante.')),
  'glass': ('decoupe-verre.html','Découpe du verre','Découpe du verre avec des coupes traversantes','Préréglé sur des plateaux de 3210 × 2250 mm sans trait de coupe. Toutes les coupes vont d’un bord à l’autre, comme l’exige la découpe par rayage.',('Coupes traversantes','Le verre ne se rompt que le long d’une ligne continue. Le plan ne contient aucune coupe qui s’arrête au milieu du plateau.'))})}

# ---- Prezzi e lista d'attesa ----
PRICE = {
 'de': dict(file='preise.html', name='Preise', h='Preise', lead='Das Berechnen bleibt kostenlos. PRO und Business sind in Vorbereitung: Tragen Sie sich ein, und wir melden uns, sobald sie verfügbar sind.', per='pro Monat', p0='0 €', p1='19 €', p2='39 €',
   free=['Unbegrenzt berechnen, Platten und Stangen','Import aus Excel und CSV','Schnittplan drucken','Letzte Liste bleibt im Browser'], pro=['Alles aus Free','Projekte speichern, unbegrenzt','Materialkosten pro Auftrag','Reststücke verwalten und wiederverwenden'], biz=['Alles aus PRO','Mehrere Mitarbeiter','Lagerbestand an Platten und Stangen','Erweiterte Exporte und API'],
   freebtn='Kostenlos starten', btn='Auf die Warteliste', soon='in Vorbereitung', formh='Warteliste', email='E-Mail-Adresse', send='Eintragen', consent='Wir verwenden Ihre Adresse nur, um Sie über diesen Plan zu informieren.', ok='Danke. Wir melden uns, sobald der Plan verfügbar ist.', err='Das hat nicht geklappt. Bitte versuchen Sie es später noch einmal.'),
 'it': dict(file='prezzi.html', name='Prezzi', h='Prezzi', lead='Il calcolo resta gratuito. PRO e Business sono in preparazione: lascia la tua email e ti avvisiamo quando sono disponibili.', per='al mese', p0='0 €', p1='19 €', p2='39 €',
   free=['Calcoli illimitati, pannelli e barre','Import da Excel e CSV','Stampa dello schema di taglio','L’ultima distinta resta nel browser'], pro=['Tutto il piano Free','Progetti salvati, senza limite','Costo del materiale per commessa','Gestione e riuso dei ritagli'], biz=['Tutto il piano PRO','Più collaboratori','Magazzino di pannelli e barre','Esportazioni avanzate e API'],
   freebtn='Inizia gratis', btn='Entra in lista d’attesa', soon='in arrivo', formh='Lista d’attesa', email='Indirizzo email', send='Iscrivimi', consent='Usiamo il tuo indirizzo solo per avvisarti su questo piano.', ok='Grazie. Ti scriviamo appena il piano è disponibile.', err='Non ha funzionato. Riprova più tardi.'),
 'en-us': dict(file='pricing.html', name='Pricing', h='Pricing', lead='Calculating stays free. PRO and Business are in the works: leave your email and we will let you know when they are available.', per='per month', p0='$0', p1='$19', p2='$39',
   free=['Unlimited calculations, sheets and bars','Import from Excel and CSV','Print the cutting plan','Your last list stays in the browser'], pro=['Everything in Free','Saved projects, unlimited','Material cost per job','Track and reuse offcuts'], biz=['Everything in PRO','Multiple team members','Sheet and bar inventory','Advanced exports and API'],
   freebtn='Start for free', btn='Join the waitlist', soon='coming soon', formh='Waitlist', email='Email address', send='Sign me up', consent='We use your address only to tell you about this plan.', ok='Thanks. We will email you as soon as the plan is available.', err='That did not work. Please try again later.'),
 'fr': dict(file='tarifs.html', name='Tarifs', h='Tarifs', lead='Le calcul reste gratuit. PRO et Business sont en préparation : laissez votre e-mail et nous vous préviendrons dès qu’ils seront disponibles.', per='par mois', p0='0 €', p1='19 €', p2='39 €',
   free=['Calculs illimités, panneaux et barres','Import depuis Excel et CSV','Impression du plan de coupe','La dernière liste reste dans le navigateur'], pro=['Tout le plan Free','Projets enregistrés, sans limite','Coût matière par commande','Gestion et réemploi des chutes'], biz=['Tout le plan PRO','Plusieurs collaborateurs','Stock de panneaux et de barres','Exports avancés et API'],
   freebtn='Commencer gratuitement', btn='Rejoindre la liste d’attente', soon='bientôt', formh='Liste d’attente', email='Adresse e-mail', send='M’inscrire', consent='Nous utilisons votre adresse uniquement pour vous informer sur cette offre.', ok='Merci. Nous vous écrirons dès que l’offre sera disponible.', err='Cela n’a pas fonctionné. Réessayez plus tard.')}

TOOLPAGE = '''    <main>
      <section class="hero plain">
        <h1>{h1}</h1>
        <p class="lead">{lead}</p>
      </section>
      <section id="tool" class="tool">
        <div id="app" data-preset='{preset}' data-pricing="./{price_file}"></div>
      </section>
      <section class="explain">
        <dl>{ex}</dl>
      </section>
{more}    </main>
'''
PRICEPAGE = '''    <main>
      <section class="text wide">
        <h1>{h}</h1>
        <p class="lead">{lead}</p>
        <div class="plans">
          <article class="plan-card"><h2>Free</h2><p class="price">{p0}</p><ul>{free}</ul><a class="btn" href="./">{freebtn}</a></article>
          <article class="plan-card featured"><h2>PRO <small>{soon}</small></h2><p class="price">{p1} <span>{per}</span></p><ul>{pro}</ul><button class="btn primary" data-plan="PRO">{btn}</button></article>
          <article class="plan-card"><h2>Business <small>{soon}</small></h2><p class="price">{p2} <span>{per}</span></p><ul>{biz}</ul><button class="btn" data-plan="Business">{btn}</button></article>
        </div>
        <form name="waitlist" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="waitlist" hidden data-ok="{ok}" data-err="{err}">
          <input type="hidden" name="form-name" value="waitlist" />
          <input type="hidden" name="plan" value="PRO" />
          <input type="hidden" name="lang" value="{lang}" />
          <p hidden><label>Leave empty <input name="bot-field" /></label></p>
          <h2>{formh}: <span data-plan-label>PRO</span></h2>
          <label>{email}<input type="email" name="email" required autocomplete="email" /></label>
          <button class="btn primary" type="submit">{send}</button>
          <p class="hint">{consent} <a href="./{priv_file}">{priv_name}</a></p>
          <p class="msg" role="status"></p>
        </form>
      </section>
    </main>
'''

def more_block(lang, current=None):
    T = TOOLS[lang]
    links = [('./', T['home'])] + [('./' + v[0], v[1]) for v in T['tools'].values()]
    items = ''.join(f'<li><a href="{href}">{name}</a></li>' for href, name in links if href != current)
    return f'      <section class="more">\n        <h2>{T["more"]}</h2>\n        <ul>{items}</ul>\n      </section>\n'

for lang, d in L.items():
    presets = IN if lang == 'en-us' else MM
    P = PRICE[lang]
    common = dict(lang=lang, htmllang=('en-US' if lang=='en-us' else lang), nav=nav(lang), price_file=P['file'], price_name=P['name'],
                  **{k: d[k] for k in ('langnav','foot','legal_file','legal_name','priv_file','priv_name')})
    home = dict(d); home.update(preset='{}', price_file=P['file'], more=more_block(lang, './'))
    open(f'{lang}/index.html','w',encoding='utf8').write(
        HEAD.format(title=d['title'], desc=d['desc'], **common) + HOME.format(**home) + FOOT.format(script='main.ts', **common))
    for key, (fname, name, h1, lead, note) in TOOLS[lang]['tools'].items():
        preset = json.dumps(dict(key=key, **presets[key]), separators=(',', ':'))
        open(f'{lang}/{fname}','w',encoding='utf8').write(
            HEAD.format(title=f'{h1} | CutPilot', desc=lead, **common)
            + TOOLPAGE.format(h1=h1, lead=lead, preset=preset, price_file=P['file'], ex=dl([note]), more=more_block(lang, './' + fname))
            + FOOT.format(script='main.ts', **common))
    open(f"{lang}/{P['file']}",'w',encoding='utf8').write(
        HEAD.format(title=f"{P['h']} | CutPilot", desc=P['lead'], **common)
        + PRICEPAGE.format(lang=lang, priv_file=d['priv_file'], priv_name=d['priv_name'], **{**P, 'free': li(P['free']), 'pro': li(P['pro']), 'biz': li(P['biz'])})
        + FOOT.format(script='page.ts', **common))
    for key, fname in (('legal', d['legal_file']), ('priv', d['priv_file'])):
        h = d[key+'_h']
        open(f'{lang}/{fname}','w',encoding='utf8').write(
            HEAD.format(title=f'{h} | CutPilot', desc=h, **common) + TEXT.format(h=h, body=body(d[key])) + FOOT.format(script='page.ts', **common))

open('index.html','w',encoding='utf8').write('''<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CutPilot</title>
    <script>
      // Apre la lingua del browser se è tra quelle disponibili, altrimenti l'inglese.
      var langs = ['de', 'it', 'fr'];
      var wanted = (navigator.languages || [navigator.language || 'en']).map(function (l) { return l.toLowerCase().slice(0, 2); });
      var match = wanted.filter(function (l) { return l === 'en' || langs.indexOf(l) >= 0; })[0] || 'en';
      if (match === 'en') match = 'en-us';
      location.replace('./' + match + '/');
    </script>
  </head>
  <body>
    <p><a href="./de/">Deutsch</a> · <a href="./it/">Italiano</a> · <a href="./en-us/">English</a> · <a href="./fr/">Français</a></p>
  </body>
</html>
''')
