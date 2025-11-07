import { GoogleGenAI, Modality } from "@google/genai";
import { Quest, LocalGuideItem, QuestDifficulty, QuestionType, Review, Language, AuthUser, QuestStatus, InfoPage } from './types';

// --- AUDIO UTILS ---
// FIX: Implement the decode function to convert base64 to Uint8Array.
export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// FIX: Implement the decodeAudioData function for raw PCM data.
export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


// --- MOCK DATABASE ---
const emptyMLString = { en: '', ru: '', ge: '' };
const MOCK_USERS: AuthUser[] = [
    { id: 'user-admin', username: 'admin', role: 'admin', fullName: 'Admin User' },
    { id: 'user-guide-1', username: 'guide', role: 'guide', fullName: 'Giorgi the Guide', city: 'Tbilisi', country: 'Georgia', email: 'guide@example.com', phone: '@giorgi_guide' }
];

// FIX: Added mock data for reviews.
const MOCK_REVIEWS: Review[] = [
    { id: 'review-1', guideItemId: 'g1', userName: 'Alex', rating: 5, comment: 'Amazing place!', date: '2023-10-26', isApproved: true },
    { id: 'review-2', guideItemId: 'g1', userName: 'Maria', rating: 4, comment: 'Very beautiful, but a bit crowded.', date: '2023-10-25', isApproved: true },
    { id: 'review-3', guideItemId: 'g2', userName: 'John', rating: 5, comment: 'Best khachapuri in town!', date: '2023-10-24', isApproved: true },
    { id: 'review-4', guideItemId: 'g3', userName: 'Anna', rating: 3, comment: 'Service was slow.', date: '2023-10-23', isApproved: false },
];
// FIX: Added mock data for guide items.
let MOCK_GUIDE_ITEMS: LocalGuideItem[] = [
    { id: 'g1', category: 'sites', title: { en: 'Narikala Fortress', ru: 'Крепость Нарикала', ge: 'ნარიყალას ციხე' }, description: { en: 'An ancient fortress overlooking Tbilisi.', ru: 'Древняя крепость с видом на Тбилиси.', ge: 'უძველესი ციხესიმაგრე, რომელიც თბილისს გადაჰყურებს.' }, address: { en: 'Tbilisi, Georgia', ru: 'Тбилиси, Грузия', ge: 'თბილისი, საქართველო' }, contact: 'N/A', coords: { lat: 41.6879, lng: 44.8075 }, image: 'https://picsum.photos/seed/narikala/800/600' },
    { id: 'g2', category: 'restaurants', title: { en: 'Sakhli #11', ru: 'Сахли #11', ge: 'სახლი #11' }, description: { en: 'Cozy restaurant with traditional Georgian cuisine.', ru: 'Уютный ресторан с традиционной грузинской кухней.', ge: 'მყუდრო რესტორანი ტრადიციული ქართული სამზარეულოთი.' }, address: { en: '11 Galaktion Tabidze St', ru: 'ул. Галактиона Табидзе, 11', ge: 'გალაკტიონ ტაბიძის ქ. 11' }, contact: '+995 322 92 03 50', coords: { lat: 41.6918, lng: 44.8035 }, image: 'https://picsum.photos/seed/sakhli/800/600' },
    { 
      id: 'g3', 
      category: 'sites', 
      title: { 
        en: 'Abanotubani - Sulphur Baths', 
        ru: 'Абанотубани - Серные бани', 
        ge: 'აბანოთუბანი - გოგირდის აბანოები' 
      }, 
      description: { 
        en: `
### Introduction
Nestled in the heart of Old Tbilisi, the Abanotubani district is home to the city's famous Sulphur Baths. These historic, dome-roofed bathhouses are built on top of natural hot springs and are an unmissable part of the Tbilisi experience, offering relaxation, health benefits, and a deep connection to the city's origins.

### Meaning and History
According to legend, the city of Tbilisi was founded because of these very springs. In the 5th century, King Vakhtang Gorgasali was hunting when his falcon fell into a hot spring and was boiled. Impressed by the discovery, he ordered a city to be built here, naming it "Tbilisi," which derives from the Georgian word "tbili," meaning "warm." For centuries, these baths were not just for hygiene but were central social hubs for citizens.

### Health Benefits of Sulphur Waters
The naturally hot (38-40°C) water is rich in sulphur and other minerals, believed to have numerous therapeutic properties:
- **Skin Conditions:** Helps with issues like eczema and acne.
- **Joint Pain:** Soothes arthritis and rheumatism.
- **Relaxation:** Relieves stress and improves sleep.
- **Detoxification:** The heat and minerals help to cleanse the body.

### Planning Your Visit
**Choosing Your Bathhouse:** There are several bathhouses, each with its own character. Some popular options include the ornate Orbeliani Baths, Gulo's Thermal Spa, and Bathhouse No. 5.
**Types of Rooms and Pricing:** You can choose a public bath (gender-separated, very affordable) or book a private room. Private rooms vary in size and luxury, with prices ranging from ~50 GEL to over 200 GEL per hour. It's best to book in advance, especially for private rooms on weekends.
**Additional Services:** The most traditional experience is to get a *kisi* scrub. This is an intense exfoliation done by a *mekise* (scrubber) that leaves your skin incredibly smooth. Massages are also available.
**What to Bring:** A swimsuit (though many go nude in private rooms), flip-flops, and a towel. Most items can be rented on-site for a small fee. It's wise to leave valuable jewelry at your accommodation.
**Etiquette and Tips:** Hydrate well before and after. Don't stay in the hot water for too long at a time. Be prepared for the distinct smell of sulphur—it's all part of the authentic experience!
**Getting There:** The Abanotubani district is located below Narikala Fortress and is easily accessible on foot from anywhere in the Old Town.
        `, 
        ru: `
### Введение
Район Абанотубани, расположенный в самом сердце Старого Тбилиси, является домом для знаменитых серных бань города. Эти исторические бани с купольными крышами построены на естественных горячих источниках и представляют собой неотъемлемую часть тбилисского опыта, предлагая расслабление, пользу для здоровья и глубокую связь с истоками города.

### Значение и история
Согласно легенде, город Тбилиси был основан именно благодаря этим источникам. В V веке царь Вахтанг Горгасали охотился, когда его сокол упал в горячий источник и сварился. Впечатленный этим открытием, он приказал построить здесь город и назвал его «Тбилиси», что происходит от грузинского слова «тбили», означающего «теплый». На протяжении веков эти бани были не просто местом для гигиены, но и центральными социальными узлами для горожан.

### Польза серных вод для здоровья
Естественно горячая (38-40°C) вода богата серой и другими минералами, которые, как считается, обладают многочисленными лечебными свойствами:
- **Кожные заболевания:** Помогает при таких проблемах, как экзема и акне.
- **Боль в суставах:** Облегчает состояние при артрите и ревматизме.
- **Расслабление:** Снимает стресс и улучшает сон.
- **Детоксикация:** Тепло и минералы помогают очистить организм.

### Планирование вашего визита
**Выбор бани:** Есть несколько бань, каждая со своим характером. Популярные варианты включают богато украшенные Орбелиановские бани, Gulo's Thermal Spa и Баню № 5.
**Типы комнат и цены:** Вы можете выбрать общественную баню (раздельные для мужчин и женщин, очень доступные) или забронировать отдельную комнату. Частные комнаты различаются по размеру и роскоши, цены варьируются от ~50 лари до более 200 лари в час. Лучше бронировать заранее, особенно частные комнаты на выходные.
**Дополнительные услуги:** Самый традиционный опыт — это пилинг *киси*. Это интенсивное отшелушивание, которое делает *мекисе* (банщик), оставляя вашу кожу невероятно гладкой. Также доступны массажи.
**Что взять с собой:** Купальник (хотя в частных комнатах многие обходятся без него), шлепанцы и полотенце. Большинство вещей можно арендовать на месте за небольшую плату. Ценные украшения лучше оставить в гостинице.
**Этикет и советы:** Пейте много воды до и после. Не оставайтесь в горячей воде слишком долго за один раз. Будьте готовы к характерному запаху серы — это часть аутентичного опыта!
**Как добраться:** Район Абанотубани расположен у подножия крепости Нарикала, и до него легко дойти пешком из любой точки Старого города.
        `, 
        ge: `
### შესავალი
ძველი თბილისის გულში მდებარე აბანოთუბნის უბანი ქალაქის ცნობილი გოგირდის აბანოების სახლია. ეს ისტორიული, გუმბათოვანი აბანოები ბუნებრივ ცხელ წყაროებზეა აგებული და თბილისური გამოცდილების განუყოფელი ნაწილია, რომელიც გთავაზობთ რელაქსაციას, ჯანმრთელობის სარგებელსა და ქალაქის წარმოშობასთან ღრმა კავშირს.

### მნიშვნელობა და ისტორია
ლეგენდის თანახმად, ქალაქი თბილისი სწორედ ამ წყაროების გამო დაარსდა. V საუკუნეში მეფე ვახტანგ გორგასალი ნადირობისას მისი შევარდენი ცხელ წყაროში ჩავარდა და მოიხარშა. ამ აღმოჩენით მოხიბლულმა მეფემ ბრძანა აქ ქალაქის აშენება და უწოდა მას "თბილისი", რაც მომდინარეობს ქართული სიტყვიდან "თბილი". საუკუნეების განმავლობაში ეს აბანოები არა მხოლოდ ჰიგიენისთვის, არამედ მოქალაქეების მთავარი სოციალური თავშეყრის ადგილი იყო.

### გოგირდის წყლების ჯანმრთელობის სარგებელი
ბუნებრივად ცხელი (38-40°C) წყალი მდიდარია გოგირდითა და სხვა მინერალებით, რომლებსაც მრავალი თერაპიული თვისება მიეწერება:
- **კანის დაავადებები:** ეხმარება ეგზემისა და აკნეს მსგავს პრობლემებს.
- **სახსრების ტკივილი:** ამსუბუქებს ართრიტსა და რევმატიზმს.
- **რელაქსაცია:** ხსნის სტრესს და აუმჯობესებს ძილს.
- **დეტოქსიკაცია:** სითბო და მინერალები ორგანიზმის გაწმენდას უწყობს ხელს.

### ვიზიტის დაგეგმვა
**აბანოს არჩევა:** არსებობს რამდენიმე აბანო, თითოეულს თავისი ხასიათი აქვს. პოპულარული ვარიანტებია მდიდრულად მორთული ორბელიანის აბანო, გულოს თერმული სპა და აბანო №5.
**ოთახების ტიპები და ფასები:** შეგიძლიათ აირჩიოთ საზოგადოებრივი აბანო (სქესის მიხედვით გამოყოფილი, ძალიან ხელმისაწვდომი) ან დაჯავშნოთ კერძო ოთახი. კერძო ოთახები განსხვავდება ზომითა და ფუფუნებით, ფასები მერყეობს ~50 ლარიდან 200 ლარზე მეტამდე საათში. უმჯობესია წინასწარ დაჯავშნა, განსაკუთრებით შაბათ-კვირას.
**დამატებითი სერვისები:** ყველაზე ტრადიციული გამოცდილებაა *ქისის* გაკეთება. ეს არის ინტენსიური პილინგი, რომელსაც *მექისე* აკეთებს და კანს საოცრად გლუვს ხდის. ასევე ხელმისაწვდომია მასაჟები.
**რა წამოვიღოთ:** საცურაო კოსტიუმი (თუმცა კერძო ოთახებში ბევრი მის გარეშე შედის), ჩუსტები და პირსახოცი. ნივთების უმეტესობის ქირაობა ადგილზე მცირე საფასურად შეგიძლიათ. ძვირფასი სამკაულები უმჯობესია საცხოვრებელში დატოვოთ.
**ეტიკეტი და რჩევები:** დალიეთ ბევრი წყალი ვიზიტამდე და შემდეგ. დიდხანს ნუ გაჩერდებით ცხელ წყალში. მოემზადეთ გოგირდის სპეციფიკური სუნისთვის — ეს ავთენტური გამოცდილების ნაწილია!
**როგორ მივიდეთ:** აბანოთუბნის უბანი ნარიყალას ციხის ქვემოთ მდებარეობს და ძველი ქალაქის ნებისმიერი წერტილიდან ფეხით ადვილად მისადგომია.
        `
      }, 
      address: { 
        en: 'Abanotubani District, Tbilisi', 
        ru: 'Район Абанотубани, Тбилиси', 
        ge: 'აბანოთუბნის უბანი, თბილისი' 
      }, 
      contact: 'Varies by bathhouse', 
      coords: { lat: 41.6888, lng: 44.8105 }, 
      image: 'https://picsum.photos/seed/abanotubani/800/600' 
    },
];
let MOCK_QUESTS: Quest[] = [
    { id: '1', authorId: 'user-admin', status: QuestStatus.Published, title: { en: 'Old Town Mysteries', ru: 'Тайны Старого города', ge: 'ძველი ქალაქის საიდუმლოებები' }, description: { en: 'Uncover secrets hidden in the narrow streets of historic Tbilisi.', ru: 'Раскройте секреты, спрятанные на узких улочках исторического Тбилиси.', ge: 'აღმოაჩინეთ ისტორიული თბილისის ვიწრო ქუჩებში დამალული საიდუმლოებები.' }, mainImage: 'https://picsum.photos/seed/oldtown/800/600', difficulty: QuestDifficulty.Easy, duration: 60, category: 'History', price: 9.99, steps: [
        { stepIndex: 0, title: { en: 'The Clock Tower', ru: 'Часовая башня', ge: 'საათის კოშკი' }, clue: { en: 'Find the leaning tower of Tbilisi, where a puppet show marks the hour.', ru: 'Найдите падающую башню Тбилиси, где кукольное представление отмечает час.', ge: 'იპოვეთ თბილისის დახრილი კოშკი, სადაც თოჯინების შოუ საათს აღნიშნავს.' }, image: 'https://picsum.photos/seed/clock/800/600', coords: { lat: 41.6934, lng: 44.8078 }, question: { type: QuestionType.OpenText, question: { en: 'What animal appears at the top of the clock?', ru: 'Какое животное появляется наверху часов?', ge: 'რომელი ცხოველი ჩანს საათის თავზე?' }, answer: { en: 'angel', ru: 'ангел', ge: 'ანგელოზი' }, hint: { en: 'It has wings and appears on the hour.', ru: 'У него есть крылья и он появляется каждый час.', ge: 'მას ფრთები აქვს და საათში ერთხელ ჩნდება.'} }, postAnswerInfo: { en: 'This unique clock tower was created by renowned Georgian puppeteer Rezo Gabriadze. The angel strikes the bell on the hour.', ru: 'Эта уникальная башня с часами была создана известным грузинским кукольником Резо Габриадзе. Ангел бьет в колокол каждый час.', ge: 'ეს უნიკალური საათის კოშკი შეიქმნა ცნობილი ქართველი მეზღაპრის რეზო გაბრიაძის მიერ. ანგელოზი საათში ერთხელ რეკავს ზარს.' } },
        { stepIndex: 1, title: { en: 'Bridge of Peace', ru: 'Мост Мира', ge: 'მშვიდობის ხიდი' }, clue: { en: 'Cross the modern glass bridge over the Mtkvari River.', ru: 'Перейдите по современному стеклянному мосту через реку Мтквари.', ge: 'გადაკვეთეთ თანამედროვე მინის ხიდი მტკვარზე.' }, image: 'https://picsum.photos/seed/bridge/800/600', coords: { lat: 41.6934, lng: 44.8092 }, question: { type: QuestionType.MultipleChoice, question: { en: 'What does the bridge light up with at night?', ru: 'Чем освещается мост ночью?', ge: 'რითი ნათდება ხიდი ღამით?' }, options: [{en: 'Morse Code', ru: 'Азбука Морзе', ge: 'მორზეს ანბანი'}, {en: 'Fireworks', ru: 'Фейерверки', ge: 'ფეიერვერკები'}, {en: 'Laser Show', ru: 'Лазерное шоу', ge: 'ლაზერული შოუ'}], answer: { en: '0', ru: '0', ge: '0' } } }
    ]},
    { id: '2', authorId: 'user-admin', status: QuestStatus.Published, title: { en: 'Soviet Ghosts', ru: 'Призраки Советов', ge: 'საბჭოთა აჩრდილები' }, description: { en: 'Explore the brutalist architecture and remnants of Georgia\'s Soviet past.', ru: 'Исследуйте бруталистическую архитектуру и остатки советского прошлого Грузии.', ge: 'გამოიკვლიეთ საქართველოს საბჭოთა წარსულის ბრუტალისტური არქიტექტურა და ნაშთები.' }, mainImage: 'https://picsum.photos/seed/soviet/800/600', difficulty: QuestDifficulty.Hard, duration: 120, category: 'Architecture', price: 9.99, steps: [] },
    { id: '3', authorId: 'user-guide-1', status: QuestStatus.Pending, title: { en: 'Tbilisi Food Tour', ru: 'Гастрономический тур по Тбилиси', ge: 'თბილისის კულინარიული ტური' }, description: { en: 'A delicious journey through the tastes of Georgia.', ru: 'Вкусное путешествие по грузинской кухне.', ge: 'უგემრიელესი მოგზაურობა ქართული გემოების სამყაროში.' }, mainImage: 'https://picsum.photos/seed/food/800/600', difficulty: QuestDifficulty.Medium, duration: 90, category: 'Food', price: 9.99, steps: [] }
];
let MOCK_INFO_PAGES: InfoPage[] = [
    { 
        id: 'how-it-works', 
        title: { en: 'How Quest Tours Work', ru: 'Как работают квесты', ge: 'როგორ მუშაობს ქვესტები' },
        content: { 
            en: '<h3>1. Choose Your Quest</h3><p>Browse our list of exciting city quests and choose the adventure that interests you most. Each quest has a unique theme, difficulty level, and duration.</p><h3>2. Purchase and Start</h3><p>Once you purchase a quest, you\'ll receive an access token. You can start the quest immediately or whenever you\'re ready. All you need is your smartphone and a sense of adventure!</p><h3>3. Follow the Clues</h3><p>Navigate through the city using our map and clues. Each step will lead you to a new location where you\'ll solve a puzzle or answer a question about your surroundings.</p><h3>4. Complete and Celebrate!</h3><p>Finish all the steps to complete the quest. You\'ll receive a digital certificate to commemorate your achievement. Share it with your friends!</p>',
            ru: '<h3>1. Выберите квест</h3><p>Просмотрите наш список увлекательных городских квестов и выберите приключение, которое вас больше всего интересует. У каждого квеста своя уникальная тема, уровень сложности и продолжительность.</p><h3>2. Купите и начните</h3><p>После покупки квеста вы получите токен доступа. Вы можете начать квест сразу или когда будете готовы. Все, что вам нужно, — это ваш смартфон и жажда приключений!</p><h3>3. Следуйте подсказкам</h3><p>Перемещайтесь по городу, используя нашу карту и подсказки. Каждый шаг приведет вас в новое место, где вам предстоит решить головоломку или ответить на вопрос об окружающей обстановке.</p><h3>4. Завершите и празднуйте!</h3><p>Выполните все шаги, чтобы завершить квест. Вы получите цифровой сертификат в ознаменование вашего достижения. Поделитесь им с друзьями!</p>',
            ge: '<h3>1. აირჩიეთ ქვესტი</h3><p>დაათვალიერეთ ჩვენი საინტერესო ქალაქის ქვესტების სია და აირჩიეთ თავგადასავალი, რომელიც ყველაზე მეტად გაინტერესებთ. თითოეულ ქვესტს აქვს უნიკალური თემა, სირთულის დონე და ხანგრძლივობა.</p><h3>2. შეიძინეთ და დაიწყეთ</h3><p>ქვესტის შეძენის შემდეგ მიიღებთ წვდომის ტოკენს. შეგიძლიათ დაიწყოთ ქვესტი დაუყოვნებლივ ან როცა მზად იქნებით. ყველაფერი რაც გჭირდებათ არის თქვენი სმარტფონი და თავგადასავლების წყურვილი!</p><h3>3. მიჰყევით მინიშნებებს</h3><p>იმოძრავეთ ქალაქში ჩვენი რუქისა და მინიშნებების გამოყენებით. თითოეული ნაბიჯი მიგიყვანთ ახალ ადგილას, სადაც ამოხსნით თავსატეხს ან უპასუხებთ კითხვას თქვენი გარემოს შესახებ.</p><h3>4. დაასრულეთ და იზეიმეთ!</h3><p>დაასრულეთ ყველა ნაბიჯი ქვესტის დასასრულებლად. თქვენ მიიღებთ ციფრულ სერთიფიკატს თქვენი მიღწევის აღსანიშნავად. გაუზიარეთ მეგობრებს!</p>',
        } 
    },
    { 
        id: 'faq', 
        title: { en: 'Frequently Asked Questions', ru: 'Часто задаваемые вопросы', ge: 'ხშირად დასმული კითხვები' },
        content: { 
            en: '<h3>What do I need to play?</h3><p>A fully charged smartphone with an internet connection and comfortable walking shoes.</p><h3>Can I play in a group?</h3><p>Yes! One quest purchase can be used by a small group on a single device. For the best experience, we recommend 2-4 people per quest.</p><h3>What if I get stuck?</h3><p>Each question comes with an optional hint to help you if you\'re having trouble.</p>',
            ru: '<h3>Что мне нужно для игры?</h3><p>Полностью заряженный смартфон с подключением к Интернету и удобная обувь для ходьбы.</p><h3>Могу ли я играть в группе?</h3><p>Да! Одну покупку квеста может использовать небольшая группа на одном устройстве. Для лучшего опыта мы рекомендуем 2-4 человека на квест.</p><h3>Что делать, если я застряну?</h3><p>К каждому вопросу прилагается необязательная подсказка, которая поможет вам, если у вас возникнут трудности.</p>',
            ge: '<h3>რა მჭირდება სათამაშოდ?</h3><p>სრულად დამუხტული სმარტფონი ინტერნეტით და კომფორტული ფეხსაცმელი.</p><h3>შემიძლია ჯგუფურად ვითამაშო?</h3><p>დიახ! ერთი ქვესტის შენაძენის გამოყენება შეუძლია მცირე ჯგუფს ერთ მოწყობილობაზე. საუკეთესო გამოცდილებისთვის, ჩვენ გირჩევთ 2-4 ადამიანს თითო ქვესტზე.</p><h3>რა ვქნა, თუ გავიჭედე?</h3><p>ყველა კითხვას მოყვება სურვილისამებრ მინიშნება, რომელიც დაგეხმარებათ, თუ გაგიჭირდათ.</p>',
        }
    },
    { 
        id: 'contact', 
        title: { en: 'Contact Us', ru: 'Связаться с нами', ge: 'დაგვიკავშირდით' },
        content: { 
            en: '<p>Have questions or feedback? We\'d love to hear from you.</p><ul><li><strong>Email:</strong> support@tourself.com</li><li><strong>Telegram:</strong> @tourself_support</li></ul>',
            ru: '<p>Есть вопросы или отзывы? Мы будем рады вас выслушать.</p><ul><li><strong>Эл. почта:</strong> support@tourself.com</li><li><strong>Telegram:</strong> @tourself_support</li></ul>',
            ge: '<p>გაქვთ შეკითხვები ან გამოხმაურება? მოხარული ვიქნებით მოვისმინოთ თქვენგან.</p><ul><li><strong>ელ. ფოსტა:</strong> support@tourself.com</li><li><strong>Telegram:</strong> @tourself_support</li></ul>',
        }
    },
    { 
        id: 'for-guides', 
        title: { en: 'For Local Guides', ru: 'Для местных гидов', ge: 'ადგილობრივი გიდებისთვის' },
        content: { 
            en: '<p>Share your local knowledge and passion by creating unique quest tours! Join our platform to design, submit, and earn from your own city adventures. We provide the tools, you provide the creativity.</p>',
            ru: '<p>Поделитесь своими местными знаниями и страстью, создавая уникальные квест-туры! Присоединяйтесь к нашей платформе, чтобы разрабатывать, отправлять и зарабатывать на своих собственных городских приключениях. Мы предоставляем инструменты, вы — творчество.</p>',
            ge: '<p>გაუზიარეთ თქვენი ადგილობრივი ცოდნა და გატაცება უნიკალური ქვესტ-ტურების შექმნით! შემოუერთდით ჩვენს პლატფორმას, რომ შეიმუშაოთ, წარადგინოთ და მიიღოთ შემოსავალი თქვენი საკუთარი ქალაქის თავგადასავლებიდან. ჩვენ გთავაზობთ ინსტრუმენტებს, თქვენ — კრეატიულობას.</p>',
        }
    },
];

// --- NEW AUTH SERVICE ---
export const authService = {
    getCurrentUser: (): AuthUser | null => {
        const userJson = sessionStorage.getItem('authUser');
        return userJson ? JSON.parse(userJson) : null;
    },
    login: async (username: string, password_raw: string): Promise<AuthUser | null> => {
        await new Promise(res => setTimeout(res, 500));
        // In a real app, password would be hashed.
        const password = (username === 'admin') ? 'admin123' : 'guide123';
        const user = MOCK_USERS.find(u => u.username === username && password_raw === password);
        if (user) {
            sessionStorage.setItem('authUser', JSON.stringify(user));
            return user;
        }
        return null;
    },
    logout: () => {
        sessionStorage.removeItem('authUser');
    },
    register: async (userData: any): Promise<AuthUser | null> => {
        await new Promise(res => setTimeout(res, 500));
        const newUser: AuthUser = {
            id: `user-guide-${Date.now()}`,
            username: userData.username,
            role: 'guide',
            ...userData
        };
        MOCK_USERS.push(newUser);
        return newUser;
    },
    getGuides: async (): Promise<AuthUser[]> => {
        await new Promise(res => setTimeout(res, 300));
        return MOCK_USERS.filter(u => u.role === 'guide');
    }
};

// --- API SERVICE ---
export const api = {
  // Guide Items
  // FIX: Implement mock API for guide items.
  getGuideItems: async (): Promise<LocalGuideItem[]> => {
    await new Promise(res => setTimeout(res, 300));
    return MOCK_GUIDE_ITEMS.map(item => {
        const itemReviews = MOCK_REVIEWS.filter(r => r.guideItemId === item.id && r.isApproved);
        const avgRating = itemReviews.length > 0 ? itemReviews.reduce((acc, r) => acc + r.rating, 0) / itemReviews.length : undefined;
        return { ...item, averageRating: avgRating };
    });
  },
  getGuideItem: async (id: string): Promise<LocalGuideItem | undefined> => {
    await new Promise(res => setTimeout(res, 300));
    const item = MOCK_GUIDE_ITEMS.find(i => i.id === id);
    if (!item) return undefined;
    const itemReviews = MOCK_REVIEWS.filter(r => r.guideItemId === item.id && r.isApproved);
    const avgRating = itemReviews.length > 0 ? itemReviews.reduce((acc, r) => acc + r.rating, 0) / itemReviews.length : undefined;
    return { ...item, averageRating: avgRating };
  },
  createGuideItem: async (itemData: Omit<LocalGuideItem, 'id' | 'averageRating'>): Promise<LocalGuideItem> => {
    await new Promise(res => setTimeout(res, 500));
    const newItem: LocalGuideItem = {
      ...itemData,
      id: `guide-${Date.now()}`,
    };
    MOCK_GUIDE_ITEMS.push(newItem);
    return newItem;
  },
  updateGuideItem: async (itemId: string, itemData: LocalGuideItem): Promise<LocalGuideItem | undefined> => {
    await new Promise(res => setTimeout(res, 500));
    const itemIndex = MOCK_GUIDE_ITEMS.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
      MOCK_GUIDE_ITEMS[itemIndex] = { ...itemData, id: itemId };
      return MOCK_GUIDE_ITEMS[itemIndex];
    }
    return undefined;
  },
  deleteGuideItem: async (itemId: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 500));
    const initialLength = MOCK_GUIDE_ITEMS.length;
    MOCK_GUIDE_ITEMS = MOCK_GUIDE_ITEMS.filter(i => i.id !== itemId);
    return MOCK_GUIDE_ITEMS.length < initialLength;
  },
  
  // Quests
  getQuests: async (): Promise<Quest[]> => {
    await new Promise(res => setTimeout(res, 500));
    // User-facing function should only return published quests
    return MOCK_QUESTS.filter(q => q.status === QuestStatus.Published);
  },
  getAllQuests: async (): Promise<Quest[]> => {
    // Admin function to get all quests regardless of status
    await new Promise(res => setTimeout(res, 500));
    return MOCK_QUESTS;
  },
  getPendingQuests: async (): Promise<Quest[]> => {
    await new Promise(res => setTimeout(res, 500));
    return MOCK_QUESTS.filter(q => q.status === QuestStatus.Pending);
  },
  getQuestsByAuthor: async (authorId: string): Promise<Quest[]> => {
    await new Promise(res => setTimeout(res, 500));
    return MOCK_QUESTS.filter(q => q.authorId === authorId);
  },
  getQuest: async (id: string): Promise<Quest | undefined> => {
    await new Promise(res => setTimeout(res, 500));
    return MOCK_QUESTS.find(q => q.id === id);
  },
  createQuest: async (questData: Omit<Quest, 'id'>): Promise<Quest> => {
    await new Promise(res => setTimeout(res, 500));
    const newQuest: Quest = {
      ...questData,
      id: `q${Date.now()}`,
    };
    MOCK_QUESTS.push(newQuest);
    return newQuest;
  },
  updateQuest: async (questId: string, questData: Quest): Promise<Quest | undefined> => {
    await new Promise(res => setTimeout(res, 500));
    const questIndex = MOCK_QUESTS.findIndex(q => q.id === questId);
    if (questIndex !== -1) {
      MOCK_QUESTS[questIndex] = { ...questData, id: questId };
      return MOCK_QUESTS[questIndex];
    }
    return undefined;
  },
  approveQuest: async (questId: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 300));
    const quest = MOCK_QUESTS.find(q => q.id === questId);
    if (quest) {
        quest.status = QuestStatus.Published;
        return true;
    }
    return false;
  },
  deleteQuest: async (questId: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 500));
    const initialLength = MOCK_QUESTS.length;
    MOCK_QUESTS = MOCK_QUESTS.filter(q => q.id !== questId);
    return MOCK_QUESTS.length < initialLength;
  },

  // Reviews
  // FIX: Implement mock API for reviews.
  getReviewsForGuideItem: async (guideItemId: string): Promise<Review[]> => {
    await new Promise(res => setTimeout(res, 300));
    // Return only approved reviews for public view
    return MOCK_REVIEWS.filter(r => r.guideItemId === guideItemId && r.isApproved);
  },
  getAllReviews: async (): Promise<Review[]> => {
    await new Promise(res => setTimeout(res, 300));
    // Admin function to get all reviews
    return MOCK_REVIEWS;
  },
  submitReview: async (guideItemId: string, rating: number, comment: string, userName: string): Promise<Review> => {
    await new Promise(res => setTimeout(res, 500));
    const newReview: Review = {
      id: `review-${Date.now()}`,
      guideItemId,
      rating,
      comment,
      userName,
      date: new Date().toISOString().split('T')[0],
      isApproved: false, // Reviews need approval
    };
    MOCK_REVIEWS.push(newReview);
    return newReview;
  },
  toggleReviewApproval: async (reviewId: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 300));
    const review = MOCK_REVIEWS.find(r => r.id === reviewId);
    if (review) {
      review.isApproved = !review.isApproved;
      return true;
    }
    return false;
  },

  // Info Pages
  getInfoPages: async (): Promise<InfoPage[]> => {
    await new Promise(res => setTimeout(res, 300));
    return MOCK_INFO_PAGES;
  },
  getInfoPage: async (id: string): Promise<InfoPage | undefined> => {
    await new Promise(res => setTimeout(res, 300));
    return MOCK_INFO_PAGES.find(p => p.id === id);
  },
  updateInfoPage: async (id: string, data: InfoPage): Promise<InfoPage | undefined> => {
    await new Promise(res => setTimeout(res, 500));
    const pageIndex = MOCK_INFO_PAGES.findIndex(p => p.id === id);
    if (pageIndex !== -1) {
        MOCK_INFO_PAGES[pageIndex] = data;
        return data;
    }
    return undefined;
  },

  // Notifications
  // FIX: Implement mock API for notifications using browser APIs.
  requestNotificationPermission: async (): Promise<string | null> => {
      if (!('Notification' in window)) {
          console.log("This browser does not support desktop notification");
          sessionStorage.setItem('notification-permission', 'denied');
          return 'denied';
      }
      const permission = await Notification.requestPermission();
      sessionStorage.setItem('notification-permission', permission);
      return permission;
  },
  sendNotification: async (title: string, message: string): Promise<boolean> => {
      const permission = sessionStorage.getItem('notification-permission');
      if (permission === 'granted') {
          new Notification(title, { body: message });
          return true;
      }
      return false;
  }
};

// Gemini API Service
const getApiKey = () => process.env.API_KEY;

// FIX: Initialize Gemini API client and implement the geminiService methods.
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const geminiService = {
    async getFunFact(topic: string, language: Language): Promise<string> {
        try {
            const langMap = { en: 'English', ru: 'Russian', ge: 'Georgian' };
            const prompt = `Tell me a fun, short, and interesting fact about "${topic}". Respond in ${langMap[language]}.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            console.error("Error getting fun fact:", error);
            return "Sorry, I couldn't think of a fun fact right now.";
        }
    },
    async generateSpeech(text: string): Promise<string | null> {
        if (!text) return null;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return base64Audio || null;
        } catch (error) {
            console.error("Error generating speech:", error);
            return null;
        }
    },
};

// Geofencing Service
// FIX: Implement distance calculation using Haversine formula.
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// FIX: Implement geofencing service using browser geolocation.
let watchId: number | null = null;
const GEOFENCE_RADIUS_KM = 0.2; // 200 meters

export const geofencingService = {
    startWatching: (
        items: LocalGuideItem[],
        onEnter: (item: LocalGuideItem) => void
    ) => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        const notifiedItems = new Set<string>();

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                items.forEach((item) => {
                    if (!notifiedItems.has(item.id)) {
                        const distance = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            item.coords.lat,
                            item.coords.lng
                        );
                        if (distance < GEOFENCE_RADIUS_KM) {
                            onEnter(item);
                            notifiedItems.add(item.id);
                        }
                    }
                });
            },
            (error) => {
                console.error("Geofencing watch error:", error);
            },
            // FIX: Removed unsupported 'distanceFilter' property from PositionOptions.
            { enableHighAccuracy: true }
        );
    },
    stopWatching: () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    },
};