import { GoogleGenAI, Modality } from "@google/genai";
import { Quest, LocalGuideItem, QuestDifficulty, QuestionType, Review, Language, AuthUser, QuestStatus, InfoPage, HomePageContent, PromoCode } from './types';

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
    {
      id: "site-narikala",
      category: "sites",
      title: { en: "Narikala Fortress", ru: "Крепость Нарикала", ge: "ნარიყალას ციხე" },
      description: {
        en: "### Description\nAn ancient fortress overlooking Tbilisi and the Mtkvari River. Narikala consists of two walled sections on a steep hill between the Sulphur Baths and the Botanical Gardens. It's a must-visit for panoramic city views and a touch of history.\n\n### History & Meaning\nEstablished in the 4th century as a Persian citadel, the fortress was expanded over the centuries by various rulers. Most of the existing fortifications date from the 16th and 17th centuries. Its name, meaning 'Little Fortress,' was given by the Mongols. It stands as a powerful symbol of Tbilisi's resilience and long history.\n\n### Interesting Facts\n*   The St. Nicholas church inside the fortress was rebuilt in 1996, replacing the original 13th-century church destroyed by fire.\n*   You can reach the fortress via an aerial tramway (cable car) from Rike Park, offering stunning views on the way up.\n*   The fortress walls offer one of the best vantage points for photographing the entire city.\n\n### Tourist Tips\n*   Wear comfortable shoes as the paths can be steep and uneven.\n*   The best time to visit is late afternoon for golden hour photography, staying until after sunset to see the city lights.\n*   The cable car is the easiest way up, but you can also walk up from the Meidan Bazaar area.\n*   Entrance to the fortress grounds is free.",
        ru: "### Описание\nДревняя крепость с видом на Тбилиси и реку Мтквари. Нарикала состоит из двух обнесенных стенами секций на крутом холме между серными банями и ботаническим садом. Это обязательное место для посещения ради панорамных видов на город и прикосновения к истории.\n\n### История и значение\nОснованная в IV веке как персидская цитадель, крепость расширялась веками различными правителями. Большинство существующих укреплений датируются XVI и XVII веками. Ее название, означающее «Маленькая крепость», было дано монголами. Она является мощным символом стойкости и долгой истории Тбилиси.\n\n### Интересные факты\n*   Церковь Святого Николая внутри крепости была восстановлена в 1996 году, заменив оригинальную церковь XIII века, уничтоженную пожаром.\n*   До крепости можно добраться на канатной дороге из парка Рике, откуда открываются потрясающие виды.\n*   Со стен крепости открывается одна из лучших точек для фотографирования всего города.\n\n### Советы туристам\n*   Наденьте удобную обувь, так как тропы могут быть крутыми и неровными.\n*   Лучшее время для посещения — поздний вечер, чтобы сделать фотографии в «золотой час» и остаться после заката, чтобы увидеть огни города.\n*   Канатная дорога — самый простой способ подняться, но можно также подняться пешком от района Мейдан Базара.\n*   Вход на территорию крепости бесплатный.",
        ge: "### აღწერა\nუძველესი ციხესიმაგრე, რომელიც გადაჰყურებს თბილისს და მდინარე მტკვარს. ნარიყალა შედგება ორი გალავნიანი ნაწილისგან ციცაბო ბორცვზე გოგირდის აბანოებსა და ბოტანიკურ ბაღს შორის. ეს არის აუცილებლად სანახავი ადგილი ქალაქის პანორამული ხედებისა და ისტორიასთან შეხებისთვის.\n\n### ისტორია და მნიშვნელობა\nდაარსდა IV საუკუნეში, როგორც სპარსული ციტადელი, ციხე საუკუნეების განმავლობაში ფართოვდებოდა სხვადასხვა მმართველების მიერ. არსებული გამაგრებების უმეტესობა XVI და XVII საუკუნეებით თარიღდება. მისი სახელი, რაც „პატარა ციხეს“ ნიშნავს, მონღოლებმა დაარქვეს. ის თბილისის გამძლეობისა და ხანგრძლივი ისტორიის მძლავრი სიმბოლოა.\n\n### საინტერესო ფაქტები\n*   წმინდა ნიკოლოზის ეკლესია ციხის შიგნით 1996 წელს აღადგინეს, რომელმაც ჩაანაცვლა XIII საუკუნის ხანძრის შედეგად განადგურებული ორიგინალური ეკლესია.\n*   ციხემდე მისვლა შესაძლებელია საბაგიროთი რიყის პარკიდან, რომელიც ასვლისას შესანიშნავ ხედებს გთავაზობთ.\n*   ციხის კედლებიდან იშლება ერთ-ერთი საუკეთესო ხედი მთელი ქალაქის გადასაღებად.\n\n### რჩევები ტურისტებს\n*   ატარეთ კომფორტული ფეხსაცმელი, რადგან ბილიკები შეიძლება იყოს ციცაბო და არათანაბარი.\n*   სტუმრობისთვის საუკეთესო დროა გვიანი შუადღე ოქროს საათის ფოტოგრაფიისთვის, მზის ჩასვლის შემდეგ კი ქალაქის განათების სანახავად.\n*   საბაგირო ასვლის უმარტივესი გზაა, მაგრამ ასევე შეგიძლიათ ფეხით ასვლა მეიდნის ბაზრის ტერიტორიიდან.\n*   ციხის ტერიტორიაზე შესვლა უფასოა."
      },
      address: { en: "Tbilisi, Georgia", ru: "Тбилиси, Грузия", ge: "თბილისი, საქართველო" },
      contact: "N/A",
      coords: { lat: 41.6879, lng: 44.8075 },
      image: "https://picsum.photos/seed/narikala-fortress/800/600",
    },
    {
      id: "site-metekhi",
      category: "sites",
      title: { en: "Metekhi Church", ru: "Церковь Метехи", ge: "მეტეხის ეკლესია" },
      description: {
        en: "### Description\nPerched on a cliff overlooking the Mtkvari River, Metekhi Church is an iconic sight in Old Tbilisi. Alongside the church stands a commanding equestrian statue of King Vakhtang Gorgasali, the city's founder. It offers a postcard-perfect view of Narikala Fortress and the old city.\n\n### History & Meaning\nKing Vakhtang Gorgasali built the first church and fort on this site in the 5th century. The current church dates to the 13th century but has been destroyed and rebuilt numerous times. For centuries, it was a royal chapel and later served as a Russian military barracks and even a theatre during the Soviet era, before being reconsecrated in 1988.\n\n### Interesting Facts\n*   The name 'Metekhi' refers to the area around the church, meaning 'the neighborhood of the palace.'\n*   It is believed to be the burial place of Saint Shushanik, one of Georgia's most revered martyrs.\n*   The statue of King Vakhtang Gorgasali was erected in 1961.\n\n### Tourist Tips\n*   The church is an active place of worship, so dress modestly (cover shoulders and knees).\n*   The platform in front of the church provides one of the best photo opportunities in Tbilisi.\n*   It's easily accessible on foot from the Meidan area or Avlabari metro station.\n*   Entry is free.",
        ru: "### Описание\nРасположенная на скале с видом на реку Мтквари, церковь Метехи является знаковым местом Старого Тбилиси. Рядом с церковью стоит величественная конная статуя царя Вахтанга Горгасали, основателя города. Отсюда открывается открыточный вид на крепость Нарикала и старый город.\n\n### История и значение\nЦарь Вахтанг Горгасали построил первую церковь и крепость на этом месте в V веке. Нынешняя церковь датируется XIII веком, но много раз разрушалась и восстанавливалась. Веками она была королевской часовней, а позже служила русской военной казармой и даже театром в советское время, прежде чем была вновь освящена в 1988 году.\n\n### Интересные факты\n*   Название «Метехи» относится к району вокруг церкви и означает «окрестности дворца».\n*   Считается, что здесь похоронена святая Шушаник, одна из самых почитаемых мучениц Грузии.\n*   Статуя царя Вахтанга Горгасали была установлена в 1961 году.\n\n### Советы туристам\n*   Церковь является действующим местом поклонения, поэтому одевайтесь скромно (прикрывайте плечи и колени).\n*   Площадка перед церковью предоставляет одну из лучших возможностей для фото в Тбилиси.\n*   До нее легко добраться пешком от района Мейдан или станции метро «Авлабари».\n*   Вход бесплатный.",
        ge: "### აღწერა\nმტკვრის პირას, კლდეზე აღმართული მეტეხის ეკლესია ძველი თბილისის ერთ-ერთი სიმბოლოა. ეკლესიის გვერდით დგას ქალაქის დამაარსებლის, მეფე ვახტანგ გორგასლის შთამბეჭდავი ცხენოსანი ძეგლი. აქედან იშლება ულამაზესი ხედი ნარიყალას ციხეზე და ძველ ქალაქზე.\n\n### ისტორია და მნიშვნელობა\nპირველი ეკლესია და ციხე ამ ადგილას მეფე ვახტანგ გორგასალმა V საუკუნეში ააგო. დღევანდელი ეკლესია XIII საუკუნით თარიღდება, მაგრამ მრავალჯერ დაინგრა და აღდგა. საუკუნეების განმავლობაში ის სამეფო სამლოცველო იყო, მოგვიანებით კი რუსულ სამხედრო ყაზარმად და საბჭოთა პერიოდში თეატრადაც კი გამოიყენებოდა, სანამ 1988 წელს ხელახლა აკურთხებდნენ.\n\n### საინტერესო ფაქტები\n*   სახელი „მეტეხი“ აღნიშნავს ეკლესიის მიმდებარე ტერიტორიას და ნიშნავს „სასახლის უბანს“.\n*   ითვლება, რომ აქ არის დაკრძალული წმინდა შუშანიკი, საქართველოს ერთ-ერთი ყველაზე პატივცემული მოწამე.\n*   ვახტანგ გორგასლის ძეგლი 1961 წელს დაიდგა.\n\n### რჩევები ტურისტებს\n*   ეკლესია მოქმედია, ამიტომ ჩაიცვით მოკრძალებულად (დაიფარეთ მხრები და მუხლები).\n*   ეკლესიის წინ მდებარე პლატფორმა თბილისში ერთ-ერთ საუკეთესო ფოტოგადაღების შესაძლებლობას იძლევა.\n*   ადვილად მისადგომია ფეხით მეიდნიდან ან მეტროსადგურ „ავლაბრიდან“.\n*   შესვლა უფასოა."
      },
      address: { en: "Metekhi St, Tbilisi", ru: "Улица Метехи, Тбилиси", ge: "მეტეხის ქ, თბილისი" },
      contact: "N/A",
      coords: { lat: 41.6908, lng: 44.8099 },
      image: "https://picsum.photos/seed/metekhi-church/800/600",
    },
    {
      id: "site-abanotubani",
      category: "sites",
      title: { en: "Abanotubani - Sulphur Baths", ru: "Абанотубани - Серные бани", ge: "აბანოთუბანი - გოგირდის აბანოები" },
      description: {
        en: "### Description\nNestled in the heart of Old Tbilisi, the Abanotubani district is home to the city's famous Sulphur Baths. These historic, dome-roofed bathhouses are built on top of natural hot springs and are an unmissable part of the Tbilisi experience, offering relaxation and health benefits.\n\n### History & Meaning\nAccording to legend, the city of Tbilisi was founded because of these very springs. In the 5th century, King Vakhtang Gorgasali's falcon fell into a hot spring, and impressed by this, he ordered a city to be built here, naming it 'Tbilisi' (from 'tbili,' meaning warm). For centuries, these baths were central social hubs.\n\n### Interesting Facts\n*   The naturally hot (38-40°C) water is rich in sulphur and other minerals, believed to have numerous therapeutic properties.\n*   Famous visitors to the baths include Alexander Pushkin and Alexandre Dumas.\n*   The most ornate bathhouse, the Orbeliani Baths, has a facade resembling a Persian madrasah.\n\n### Tourist Tips\n*   You can book a public bath or a private room. Private rooms are recommended and should be booked in advance.\n*   Don't miss the traditional 'kisi' scrub for an intense exfoliation experience.\n*   Bring flip-flops and a towel, though they can be rented.\n*   Be prepared for the distinct smell of sulphur!",
        ru: "### Описание\nРайон Абанотубани, расположенный в самом сердце Старого Тбилиси, является домом для знаменитых серных бань города. Эти исторические бани с купольными крышами построены на естественных горячих источниках и представляют собой неотъемлемую часть тбилисского опыта, предлагая расслабление и пользу для здоровья.\n\n### История и значение\nСогласно легенде, город Тбилиси был основан именно благодаря этим источникам. В V веке сокол царя Вахтанга Горгасали упал в горячий источник, и, впечатленный этим, царь приказал построить здесь город, назвав его «Тбилиси» (от «тбили», что означает «теплый»). На протяжении веков эти бани были центральными социальными узлами.\n\n### Интересные факты\n*   Естественно горячая (38-40°C) вода богата серой и другими минералами, которые, как считается, обладают многочисленными лечебными свойствами.\n*   Среди знаменитых посетителей бань были Александр Пушкин и Александр Дюма.\n*   Самая богато украшенная баня, Орбелиановская, имеет фасад, напоминающий персидское медресе.\n\n### Советы туристам\n*   Вы можете забронировать общественную баню или отдельную комнату. Рекомендуются частные комнаты, которые следует бронировать заранее.\n*   Не пропустите традиционный пилинг «киси» для интенсивного отшелушивания.\n*   Возьмите с собой шлепанцы и полотенце, хотя их можно арендовать.\n*   Будьте готовы к характерному запаху серы!",
        ge: "### აღწერა\nძველი თბილისის გულში მდებარე აბანოთუბნის უბანი ქალაქის ცნობილი გოგირდის აბანოების სახლია. ეს ისტორიული, გუმბათოვანი აბანოები ბუნებრივ ცხელ წყაროებზეა აგებული და თბილისური გამოცდილების განუყოფელი ნაწილია, რომელიც გთავაზობთ რელაქსაციას და ჯანმრთელობის სარგებელს.\n\n### ისტორია და მნიშვნელობა\nლეგენდის თანახმად, ქალაქი თბილისი სწორედ ამ წყაროების გამო დაარსდა. V საუკუნეში მეფე ვახტანგ გორგასლის შევარდენი ცხელ წყაროში ჩავარდა და ამით მოხიბლულმა მეფემ ბრძანა აქ ქალაქის აშენება და უწოდა მას „თბილისი“ (სიტყვიდან „თბილი“). საუკუნეების განმავლობაში ეს აბანოები მთავარი სოციალური თავშეყრის ადგილი იყო.\n\n### საინტერესო ფაქტები\n*   ბუნებრივად ცხელი (38-40°C) წყალი მდიდარია გოგირდითა და სხვა მინერალებით, რომლებსაც მრავალი თერაპიული თვისება მიეწერება.\n*   აბანოების ცნობილ სტუმრებს შორის იყვნენ ალექსანდრე პუშკინი და ალექსანდრე დიუმა.\n*   ყველაზე მდიდრულად მორთულ ორბელიანის აბანოს ფასადი სპარსულ მედრესეს მოგაგონებთ.\n\n### რჩევები ტურისტებს\n*   შეგიძლიათ დაჯავშნოთ საზოგადოებრივი აბანო ან კერძო ოთახი. რეკომენდებულია კერძო ოთახები, რომლებიც წინასწარ უნდა დაჯავშნოთ.\n*   არ გამოტოვოთ ტრადიციული „ქისის“ პროცედურა ინტენსიური პილინგისთვის.\n*   წამოიღეთ ჩუსტები და პირსახოცი, თუმცა მათი ქირაობაც შესაძლებელია.\n*   მოემზადეთ გოგირდის სპეციფიკური სუნისთვის!"
      },
      address: { en: "Abanotubani District, Tbilisi", ru: "Район Абанотубани, Тбилиси", ge: "აბანოთუბნის უბანი, თბილისი" },
      contact: "Varies by bathhouse",
      coords: { lat: 41.6888, lng: 44.8105 },
      image: "https://picsum.photos/seed/abanotubani/800/600",
    },
    {
        id: "site-botanical-garden",
        category: "sites",
        title: { en: "Tbilisi Botanical Garden", ru: "Тбилисский ботанический сад", ge: "თბილისის ბოტანიკური ბაღი" },
        description: {
          en: "### Description\nA vast green oasis nestled in the Tsavkisis-Tskali Gorge, right behind Narikala Fortress. Spanning 161 hectares, it boasts a diverse collection of flora from around the world. It's a perfect escape from the city bustle, with shady paths, waterfalls, and scenic picnic spots.\n\n### History & Meaning\nThe garden's history spans more than three centuries. It was first described in 1671 as the 'royal gardens' and was officially established as the Tiflis Botanical Garden in 1845. It has served as a major center for botanical research and conservation in the Caucasus region.\n\n### Interesting Facts\n*   The garden is home to over 4,500 different plant species.\n*   There are several picturesque bridges and a lovely waterfall within the garden grounds.\n*   It contains a unique collection of Caucasian plants, many of which are rare or endangered.\n\n### Tourist Tips\n*   There is a small entrance fee (around 4 GEL).\n*   Wear comfortable walking shoes, as the terrain is hilly and expansive.\n*   Plan at least 2-3 hours to explore a good portion of the garden.\n*   The main entrance is at the foot of Narikala Fortress, but there's another near the Sololaki district.",
          ru: "### Описание\nОбширный зеленый оазис, расположенный в ущелье Цавкисис-Цкали, прямо за крепостью Нарикала. Занимая 161 гектар, он может похвастаться разнообразной коллекцией флоры со всего мира. Это идеальное место для отдыха от городской суеты с тенистыми тропами, водопадами и живописными местами для пикника.\n\n### История и значение\nИстория сада насчитывает более трех столетий. Впервые он был описан в 1671 году как «королевские сады» и был официально учрежден как Тифлисский ботанический сад в 1845 году. Он служил крупным центром ботанических исследований и охраны природы на Кавказе.\n\n### Интересные факты\n*   В саду произрастает более 4500 различных видов растений.\n*   На территории сада есть несколько живописных мостов и прекрасный водопад.\n*   Здесь собрана уникальная коллекция кавказских растений, многие из которых являются редкими или находятся под угрозой исчезновения.\n\n### Советы туристам\n*   Вход платный (около 4 лари).\n*   Наденьте удобную обувь для ходьбы, так как местность холмистая и обширная.\n*   Запланируйте не менее 2-3 часов, чтобы осмотреть значительную часть сада.\n*   Главный вход находится у подножия крепости Нарикала, но есть и другой вход, рядом с районом Сололаки.",
          ge: "### აღწერა\nვრცელი მწვანე ოაზისი, რომელიც მდებარეობს წავკისისწყლის ხეობაში, პირდაპირ ნარიყალას ციხის უკან. 161 ჰექტარზე გადაჭიმული, ის ამაყობს მსოფლიოს სხვადასხვა კუთხიდან ჩამოტანილი ფლორის მრავალფეროვანი კოლექციით. ეს არის შესანიშნავი ადგილი ქალაქის ხმაურისგან თავის დასაღწევად, ჩრდილიანი ბილიკებით, ჩანჩქერებითა და პიკნიკისთვის განკუთვნილი ლამაზი ადგილებით.\n\n### ისტორია და მნიშვნელობა\nბაღის ისტორია სამ საუკუნეზე მეტს ითვლის. ის პირველად 1671 წელს აღიწერა, როგორც „სამეფო ბაღები“ და ოფიციალურად, როგორც თბილისის ბოტანიკური ბაღი, 1845 წელს დაარსდა. ის კავკასიის რეგიონში ბოტანიკური კვლევისა და კონსერვაციის მთავარ ცენტრს წარმოადგენდა.\n\n### საინტერესო ფაქტები\n*   ბაღში 4500-ზე მეტი სხვადასხვა სახეობის მცენარეა.\n*   ბაღის ტერიტორიაზე რამდენიმე ლამაზი ხიდი და მშვენიერი ჩანჩქერია.\n*   ის შეიცავს კავკასიური მცენარეების უნიკალურ კოლექციას, რომელთაგან ბევრი იშვიათი ან გადაშენების პირას მყოფია.\n\n### რჩევები ტურისტებს\n*   შესვლა ფასიანია (დაახლოებით 4 ლარი).\n*   ჩაიცვით კომფორტული ფეხსაცმელი, რადგან რელიეფი გორაკიანი და ვრცელია.\n*   დაგეგმეთ მინიმუმ 2-3 საათი ბაღის მნიშვნელოვანი ნაწილის დასათვალიერებლად.\n*   მთავარი შესასვლელი ნარიყალას ციხის ძირშია, მაგრამ არის სხვა შესასვლელიც სოლოლაკის უბანთან ახლოს."
        },
        address: { en: "1 Botanikuri St, Tbilisi", ru: "Улица Ботаникури 1, Тбилиси", ge: "ბოტანიკურის ქ. 1, თბილისი" },
        contact: "+995 322 72 34 37",
        coords: { lat: 41.6875, lng: 44.8093 },
        image: "https://picsum.photos/seed/botanical-garden/800/600",
      },
      {
        id: "site-betlemi-stairs",
        category: "sites",
        title: { en: "Betlemi Street Stairs & Ascent", ru: "Лестница и подъем на улице Бетлеми", ge: "ბეთლემის ქუჩის კიბე და აღმართი" },
        description: {
          en: "### Description\nA charming and picturesque ascent in the heart of Old Sololaki, leading up towards Narikala Fortress. The area is filled with classic Tbilisi architecture: old houses with intricate wooden balconies, vine-covered walls, and hidden courtyards. It's a photographer's dream and a quiet path to explore.\n\n### History & Meaning\nThis area represents the authentic Old Tbilisi, with its winding, narrow streets and historic residential buildings. The Betlemi Stairs lead to the Upper and Lower Betlemi Churches, some of the oldest in the city. The ascent has long been a route for both residents and pilgrims heading up the holy mountain.\n\n### Interesting Facts\n*   The area is home to the Ateshgah of Tbilisi, an ancient Zoroastrian fire temple.\n*   Many of the buildings feature a unique mix of Georgian, European, and Middle Eastern architectural styles.\n*   Exploring the side alleys off the main stairs often leads to unexpected and beautiful views.\n\n### Tourist Tips\n*   Wear sturdy footwear as the stairs and cobbled streets are steep.\n*   This is a much more scenic and peaceful route to Narikala than the main road.\n*   The area is beautiful both day and night, offering different atmospheres.\n*   Respect the residents as you are walking through a residential neighborhood.",
          ru: "### Описание\nОчаровательный и живописный подъем в самом сердце старого Сололаки, ведущий к крепости Нарикала. Район полон классической тбилисской архитектуры: старые дома с искусными деревянными балконами, увитые виноградом стены и скрытые дворики. Это мечта фотографа и тихий путь для исследования.\n\n### История и значение\nЭтот район представляет собой аутентичный Старый Тбилиси с его извилистыми, узкими улочками и историческими жилыми домами. Лестница Бетлеми ведет к Верхней и Нижней церквям Бетлеми, одним из старейших в городе. Подъем долгое время был маршрутом как для жителей, так и для паломников, направляющихся на святую гору.\n\n### Интересные факты\n*   В этом районе находится Атешга, древний зороастрийский храм огня.\n*   Многие здания отличаются уникальным сочетанием грузинского, европейского и ближневосточного архитектурных стилей.\n*   Исследование боковых переулков от основной лестницы часто приводит к неожиданным и красивым видам.\n\n### Советы туристам\n*   Наденьте прочную обувь, так как лестницы и мощеные улицы крутые.\n*   Это гораздо более живописный и спокойный маршрут к Нарикале, чем главная дорога.\n*   Район красив как днем, так и ночью, предлагая разную атмосферу.\n*   Уважайте жителей, так как вы идете через жилой район.",
          ge: "### აღწერა\nმომხიბლავი და თვალწარმტაცი აღმართი ძველი სოლოლაკის გულში, რომელიც ნარიყალას ციხისკენ მიემართება. ტერიტორია სავსეა კლასიკური თბილისური არქიტექტურით: ძველი სახლები რთული ხის აივნებით, ვაზით დაფარული კედლებითა და ფარული ეზოებით. ეს ფოტოგრაფის ოცნება და წყნარი, აღმოსაჩენი ბილიკია.\n\n### ისტორია და მნიშვნელობა\nეს ტერიტორია წარმოადგენს ავთენტურ ძველ თბილისს თავისი მიხვეულ-მოხვეული, ვიწრო ქუჩებითა და ისტორიული საცხოვრებელი შენობებით. ბეთლემის კიბე მიდის ზემო და ქვემო ბეთლემის ეკლესიებთან, რომლებიც ქალაქის ერთ-ერთი უძველესია. აღმართი დიდი ხანია იყო როგორც მაცხოვრებლების, ისე წმინდა მთისკენ მიმავალი პილიგრიმების მარშრუტი.\n\n### საინტერესო ფაქტები\n*   ამ ტერიტორიაზე მდებარეობს ათეშგა, უძველესი ზოროასტრული ცეცხლის ტაძარი.\n*   ბევრი შენობა გამოირჩევა ქართული, ევროპული და ახლო აღმოსავლური არქიტექტურული სტილის უნიკალური ნაზავით.\n*   მთავარი კიბიდან გამავალი გვერდითი ჩიხების შესწავლა ხშირად მოულოდნელ და ლამაზ ხედებს გპირდებათ.\n\n### რჩევები ტურისტებს\n*   ჩაიცვით მყარი ფეხსაცმელი, რადგან კიბეები და ქვაფენილიანი ქუჩები ციცაბოა.\n*   ეს ბევრად უფრო ლამაზი და მშვიდი მარშრუტია ნარიყალასკენ, ვიდრე მთავარი გზა.\n*   ტერიტორია ლამაზია როგორც დღისით, ისე ღამით და განსხვავებულ ატმოსფეროს გთავაზობთ.\n*   პატივი ეცით მაცხოვრებლებს, რადგან საცხოვრებელ უბანში სეირნობთ."
        },
        address: { en: "Betlemi Street, Tbilisi", ru: "Улица Бетлеми, Тбилиси", ge: "ბეთლემის ქუჩა, თბილისი" },
        contact: "N/A",
        coords: { lat: 41.6903, lng: 44.8061 },
        image: "https://picsum.photos/seed/betlemi-stairs/800/600",
      },
      {
        id: "site-shardeni",
        category: "sites",
        title: { en: "Shardeni Street", ru: "Улица Шардени", ge: "შარდენის ქუჩა" },
        description: {
          en: "### Description\nA bustling, pedestrian-only street in the heart of Old Tbilisi, famous for its vibrant nightlife. Shardeni Street is lined with a variety of restaurants, cafes, trendy bars, and art galleries. It's one of the city's main cultural and social hubs, always buzzing with energy day and night.\n\n### History & Meaning\nThe street was named after the 17th-century French traveler Jean Chardin, who documented his visit to Tbilisi. Historically, this area was a center for craftsmen and merchants. In the early 2000s, it was renovated to become the lively entertainment district it is today.\n\n### Interesting Facts\n*   The street is home to several unique modern sculptures, including a miniature replica of the Eiffel Tower.\n*   Many of the buildings retain their historic facades despite modern interiors.\n*   It connects the Meidan Bazaar with Sioni Cathedral.\n\n### Tourist Tips\n*   Prices at restaurants and bars can be higher here than in other parts of the city.\n*   It's a great place for people-watching from an outdoor cafe.\n*   The street is relatively quiet during the day but comes alive after sunset.\n*   Be aware of 'tourist trap' restaurants; check reviews before choosing a place to eat.",
          ru: "### Описание\nОживленная, пешеходная улица в самом сердце Старого Тбилиси, известная своей бурной ночной жизнью. Улица Шардени заполнена разнообразными ресторанами, кафе, модными барами и художественными галереями. Это один из главных культурных и социальных центров города, всегда полный энергии днем и ночью.\n\n### История и значение\nУлица была названа в честь французского путешественника XVII века Жана Шардена, который задокументировал свой визит в Тбилиси. Исторически этот район был центром ремесленников и торговцев. В начале 2000-х годов он был отреставрирован и превратился в оживленный развлекательный район, каким он является сегодня.\n\n### Интересные факты\n*   На улице находится несколько уникальных современных скульптур, включая миниатюрную копию Эйфелевой башни.\n*   Многие здания сохранили свои исторические фасады, несмотря на современные интерьеры.\n*   Она соединяет Мейдан Базар с собором Сиони.\n\n### Советы туристам\n*   Цены в ресторанах и барах здесь могут быть выше, чем в других частях города.\n*   Это отличное место для наблюдения за людьми из уличного кафе.\n*   Улица относительно тихая днем, но оживает после захода солнца.\n*   Остерегайтесь «туристических ловушек»; проверяйте отзывы, прежде чем выбрать место для еды.",
          ge: "### აღწერა\nხალხმრავალი, მხოლოდ ფეხით მოსიარულეთათვის განკუთვნილი ქუჩა ძველი თბილისის გულში, რომელიც ცნობილია თავისი აქტიური ღამის ცხოვრებით. შარდენის ქუჩაზე განლაგებულია მრავალფეროვანი რესტორნები, კაფეები, მოდური ბარები და სამხატვრო გალერეები. ეს არის ქალაქის ერთ-ერთი მთავარი კულტურული და სოციალური ცენტრი, რომელიც დღე და ღამე ენერგიითაა სავსე.\n\n### ისტორია და მნიშვნელობა\nქუჩას სახელი ეწოდა XVII საუკუნის ფრანგი მოგზაურის, ჟან შარდენის პატივსაცემად, რომელმაც აღწერა თავისი ვიზიტი თბილისში. ისტორიულად, ეს ტერიტორია ხელოსნებისა და ვაჭრების ცენტრი იყო. 2000-იანი წლების დასაწყისში ის განახლდა და გადაიქცა ცოცხალ გასართობ უბნად.\n\n### საინტერესო ფაქტები\n*   ქუჩაზე რამდენიმე უნიკალური თანამედროვე ქანდაკებაა, მათ შორის ეიფელის კოშკის მინიატურული ასლი.\n*   ბევრ შენობას, თანამედროვე ინტერიერის მიუხედავად, შენარჩუნებული აქვს ისტორიული ფასადი.\n*   ის მეიდნის ბაზარს სიონის საკათედრო ტაძართან აკავშირებს.\n\n### რჩევები ტურისტებს\n*   რესტორნებსა და ბარებში ფასები შეიძლება უფრო მაღალი იყოს, ვიდრე ქალაქის სხვა ნაწილებში.\n*   ეს შესანიშნავი ადგილია ღია კაფედან ხალხზე დასაკვირვებლად.\n*   ქუჩა დღისით შედარებით წყნარია, მაგრამ მზის ჩასვლის შემდეგ ცოცხლდება.\n*   ფრთხილად იყავით „ტურისტული ხაფანგებისგან“; საჭმელად ადგილის არჩევამდე შეამოწმეთ მიმოხილვები."
        },
        address: { en: "Kote Abkhazi St, Tbilisi", ru: "Улица Котэ Абхази, Тбилиси", ge: "კოტე აფხაზის ქ, თბილისი" },
        contact: "N/A",
        coords: { lat: 41.6912, lng: 44.8073 },
        image: "https://picsum.photos/seed/shardeni-street/800/600",
      },
      {
        id: "site-peace-bridge",
        category: "sites",
        title: { en: "The Peace Bridge", ru: "Мост Мира", ge: "მშვიდობის ხიდი" },
        description: {
          en: "### Description\nA stunning example of modern architecture, the Peace Bridge is a bow-shaped pedestrian bridge over the Mtkvari River. Made of steel and glass and illuminated with thousands of LEDs, it connects Old Tbilisi with the newly developed Rike Park, creating a striking contrast between old and new.\n\n### History & Meaning\nCommissioned by President Mikheil Saakashvili and opened in 2010, the bridge was designed by Italian architect Michele De Lucchi. Its design was controversial among some, but it has since become a major city landmark. It's intended to symbolize Georgia's journey from its past to a brighter future.\n\n### Interesting Facts\n*   The lighting system was designed by French lighting designer Philippe Martinaud.\n*   The lights, which turn on 90 minutes before sunset, display patterns and messages, including the periodic table of elements.\n*   The bridge is 156 meters long.\n\n### Tourist Tips\n*   The bridge is most spectacular at night when it is fully illuminated.\n*   It's a fantastic spot for photos, offering views of the Presidential Palace, Narikala, and Metekhi Church.\n*   As it's pedestrian-only, it's a pleasant way to cross the river on foot.\n*   It can get very crowded, especially on summer evenings.",
          ru: "### Описание\nПотрясающий пример современной архитектуры, Мост Мира — это пешеходный мост в форме лука через реку Мтквари. Сделанный из стали и стекла и освещенный тысячами светодиодов, он соединяет Старый Тбилиси с недавно созданным парком Рике, создавая поразительный контраст между старым и новым.\n\n### История и значение\nЗаказанный президентом Михаилом Саакашвили и открытый в 2010 году, мост был спроектирован итальянским архитектором Микеле Де Лукки. Его дизайн вызвал споры, но с тех пор он стал главной достопримечательностью города. Он призван символизировать путь Грузии из прошлого в светлое будущее.\n\n### Интересные факты\n*   Система освещения была разработана французским дизайнером по свету Филиппом Мартино.\n*   Огни, которые включаются за 90 минут до заката, отображают узоры и сообщения, включая периодическую таблицу элементов.\n*   Длина моста составляет 156 метров.\n\n### Советы туристам\n*   Мост наиболее впечатляюще выглядит ночью, когда он полностью освещен.\n*   Это фантастическое место для фотографий с видами на Президентский дворец, Нарикалу и церковь Метехи.\n*   Поскольку он только для пешеходов, это приятный способ пересечь реку пешком.\n*   Может быть очень многолюдно, особенно летними вечерами.",
          ge: "### აღწერა\nთანამედროვე არქიტექტურის საოცარი ნიმუში, მშვიდობის ხიდი არის მშვილდის ფორმის საფეხმავლო ხიდი მდინარე მტკვარზე. ფოლადისა და მინისგან დამზადებული და ათასობით LED ნათურით განათებული, ის აკავშირებს ძველ თბილისს ახლად განვითარებულ რიყის პარკთან, ქმნის რა გასაოცარ კონტრასტს ძველსა და ახალს შორის.\n\n### ისტორია და მნიშვნელობა\nპრეზიდენტ მიხეილ სააკაშვილის დაკვეთით, ხიდი 2010 წელს გაიხსნა და მისი დიზაინი იტალიელ არქიტექტორს, მიკელე დე ლუკის ეკუთვნის. მისმა დიზაინმა გარკვეული დაპირისპირება გამოიწვია, მაგრამ მას შემდეგ ის ქალაქის მთავარ ღირსშესანიშნაობად იქცა. ის განასახიერებს საქართველოს გზას წარსულიდან ნათელი მომავლისკენ.\n\n### საინტერესო ფაქტები\n*   განათების სისტემა შექმნილია ფრანგი განათების დიზაინერის, ფილიპ მარტინოს მიერ.\n*   ნათურები, რომლებიც მზის ჩასვლამდე 90 წუთით ადრე ირთვება, აჩვენებს პატერნებსა და შეტყობინებებს, მათ შორის პერიოდულობის სისტემის ელემენტებს.\n*   ხიდის სიგრძე 156 მეტრია.\n\n### რჩევები ტურისტებს\n*   ხიდი ყველაზე შთამბეჭდავია ღამით, როდესაც ის სრულად არის განათებული.\n*   ეს არის ფანტასტიკური ადგილი ფოტოებისთვის, საიდანაც იშლება ხედები პრეზიდენტის სასახლეზე, ნარიყალასა და მეტეხის ეკლესიაზე.\n*   რადგან ის მხოლოდ ფეხით მოსიარულეთათვისაა, ეს სასიამოვნო საშუალებაა მდინარის ფეხით გადასაკვეთად.\n*   შეიძლება ძალიან ხალხმრავალი იყოს, განსაკუთრებით ზაფხულის საღამოობით."
        },
        address: { en: "Mtkvari River, Tbilisi", ru: "Река Мтквари, Тбилиси", ge: "მდინარე მტკვარი, თბილისი" },
        contact: "N/A",
        coords: { lat: 41.6931, lng: 44.8085 },
        image: "https://picsum.photos/seed/peace-bridge/800/600",
      },
      {
        id: "site-rike-park",
        category: "sites",
        title: { en: "Rike Park", ru: "Парк Рике", ge: "რიყის პარკი" },
        description: {
          en: "### Description\nA modern recreational area on the left bank of the Mtkvari River, connected to the Old Town by the Peace Bridge. Rike Park features musical fountains, a giant chessboard, children's playgrounds, and two futuristic tube-like buildings that house a concert hall and exhibition space.\n\n### History & Meaning\nDeveloped in the 2010s, Rike Park is part of a larger city modernization project. It transformed a relatively unused riverbank into a vibrant public space for locals and tourists alike. It represents the new, contemporary face of Tbilisi.\n\n### Interesting Facts\n*   The park is the starting point for the aerial tramway (cable car) that takes you up to Narikala Fortress.\n*   The two large, metallic tube structures were designed by Italian architects Massimiliano and Doriana Fuksas.\n*   The musical and dancing fountains are a major attraction in the evenings.\n\n### Tourist Tips\n*   It's a great place for families with children.\n*   Combine a visit to the park with a walk across the Peace Bridge and a cable car ride to Narikala.\n*   The park is free to enter.\n*   In summer, it's a popular spot to relax and cool down in the evening.",
          ru: "### Описание\nСовременная зона отдыха на левом берегу реки Мтквари, соединенная с Старым городом Мостом Мира. В парке Рике есть музыкальные фонтаны, гигантская шахматная доска, детские площадки и два футуристических здания в виде труб, в которых размещаются концертный зал и выставочное пространство.\n\n### История и значение\nСозданный в 2010-х годах, парк Рике является частью более крупного проекта по модернизации города. Он превратил относительно неиспользуемый берег реки в оживленное общественное пространство для местных жителей и туристов. Он представляет новое, современное лицо Тбилиси.\n\n### Интересные факты\n*   Парк является отправной точкой для канатной дороги, которая доставит вас к крепости Нарикала.\n*   Две большие металлические трубчатые конструкции были спроектированы итальянскими архитекторами Массимилиано и Дорианой Фуксас.\n*   Музыкальные и танцующие фонтаны являются главной достопримечательностью по вечерам.\n\n### Советы туристам\n*   Это отличное место для семей с детьми.\n*   Совместите посещение парка с прогулкой по Мосту Мира и поездкой на канатной дороге к Нарикале.\n*   Вход в парк бесплатный.\n*   Летом это популярное место для отдыха и прохлады вечером.",
          ge: "### აღწერა\nთანამედროვე დასასვენებელი ზონა მდინარე მტკვრის მარცხენა სანაპიროზე, რომელიც ძველ ქალაქს მშვიდობის ხიდით უკავშირდება. რიყის პარკში არის მუსიკალური შადრევნები, გიგანტური ჭადრაკის დაფა, საბავშვო მოედნები და ორი ფუტურისტული, მილის ფორმის შენობა, რომლებშიც საკონცერტო დარბაზი და საგამოფენო სივრცეა განთავსებული.\n\n### ისტორია და მნიშვნელობა\n2010-იან წლებში განვითარებული რიყის პარკი ქალაქის მოდერნიზაციის უფრო დიდი პროექტის ნაწილია. მან შედარებით გამოუყენებელი სანაპირო აქცია ცოცხალ საზოგადოებრივ სივრცედ როგორც ადგილობრივებისთვის, ისე ტურისტებისთვის. ის წარმოადგენს თბილისის ახალ, თანამედროვე სახეს.\n\n### საინტერესო ფაქტები\n*   პარკი არის საბაგიროს საწყისი წერტილი, რომელიც ნარიყალას ციხეზე აგიყვანთ.\n*   ორი დიდი, მეტალის მილის ფორმის სტრუქტურა დააპროექტეს იტალიელმა არქიტექტორებმა მასიმილიანო და დორიანა ფუქსასებმა.\n*   მუსიკალური და მოცეკვავე შადრევნები საღამოობით მთავარი ღირსშესანიშნაობაა.\n\n### რჩევები ტურისტებს\n*   ეს შესანიშნავი ადგილია ბავშვებიანი ოჯახებისთვის.\n*   შეუთავსეთ პარკის მონახულება მშვიდობის ხიდზე გასეირნებას და საბაგიროთი ნარიყალაზე ასვლას.\n*   პარკში შესვლა უფასოა.\n*   ზაფხულში ეს პოპულარული ადგილია საღამოს დასასვენებლად და გასაგრილებლად."
        },
        address: { en: "Left bank of Mtkvari River, Tbilisi", ru: "Левый берег реки Мтквари, Тбилиси", ge: "მტკვრის მარცხენა სანაპირო, თბილისი" },
        contact: "N/A",
        coords: { lat: 41.6934, lng: 44.8105 },
        image: "https://picsum.photos/seed/rike-park/800/600",
      },
    {
      id: "g2",
      category: "restaurants",
      title: { en: "Sakhli #11", ru: "Сахли #11", ge: "სახლი #11" },
      description: {
        en: "Cozy restaurant with traditional Georgian cuisine.",
        ru: "Уютный ресторан с традиционной грузинской кухней.",
        ge: "მყუდრო რესტორანი ტრადიციული ქართული სამზარეულოთი.",
      },
      address: {
        en: "11 Galaktion Tabidze St",
        ru: "ул. Галактиона Табидзе, 11",
        ge: "გალაკტიონ ტაბიძის ქ. 11",
      },
      contact: "+995 322 92 03 50",
      coords: { lat: 41.6918, lng: 44.8035 },
      image: "https://picsum.photos/seed/sakhli/800/600",
    },
    {
      id: "service-bank",
      category: "services",
      subCategory: "banks_atms",
      title: { en: "TBC Bank", ru: "TBC Банк", ge: "თიბისი ბანკი" },
      description: { en: "Main branch of TBC Bank, offering a full range of banking services, currency exchange, and 24/7 ATMs.", ru: "Главный филиал TBC Bank, предлагающий полный спектр банковских услуг, обмен валюты и круглосуточные банкоматы.", ge: "თიბისი ბანკის მთავარი ფილიალი, რომელიც გთავაზობთ საბანკო მომსახურების სრულ სპექტრს, ვალუტის გადაცვლას და 24/7 ბანკომატებს." },
      address: { en: "4 Marjanishvili St, Tbilisi", ru: "ул. Марджанишвили 4, Тбилиси", ge: "მარჯანიშვილის ქ. 4, თბილისი" },
      contact: "+995 322 27 27 27",
      coords: { lat: 41.7093, lng: 44.7963 },
      image: "https://picsum.photos/seed/tbc-bank/800/600",
    },
    {
      id: "service-car-rental",
      category: "services",
      subCategory: "car_rentals",
      title: { en: "Hertz Car Rental", ru: "Hertz Аренда Авто", ge: "Hertz მანქანის გაქირავება" },
      description: { en: "International car rental service with a wide range of vehicles available, located conveniently in the city center.", ru: "Международная служба проката автомобилей с широким выбором транспортных средств, удобно расположенная в центре города.", ge: "მანქანების გაქირავების საერთაშორისო სერვისი, ავტომობილების ფართო არჩევანით, მოხერხებულად მდებარეობს ქალაქის ცენტრში." },
      address: { en: "1 Baratashvili St, Tbilisi", ru: "ул. Бараташвили 1, Тбилиси", ge: "ბარათაშვილის ქ. 1, თბილისი" },
      contact: "+995 322 19 11 91",
      coords: { lat: 41.6963, lng: 44.8055 },
      image: "https://picsum.photos/seed/hertz-rental/800/600",
    },
    {
      id: "service-clinic",
      category: "services",
      subCategory: "medical_clinics",
      title: { en: "Evex Medical Center", ru: "Медицинский центр Evex", ge: "სამედიცინო ცენტრი ევექსი" },
      description: { en: "A modern, multi-profile medical center offering a wide range of outpatient services and diagnostics.", ru: "Современный многопрофильный медицинский центр, предлагающий широкий спектр амбулаторных услуг и диагностики.", ge: "თანამედროვე, მრავალპროფილური სამედიცინო ცენტრი, რომელიც გთავაზობთ ამბულატორიული მომსახურებისა და დიაგნოსტიკის ფართო სპექტრს." },
      address: { en: "23 Kavtaradze St, Tbilisi", ru: "ул. Кавтарадзе 23, Тбилиси", ge: "ქავთარაძის ქ. 23, თბილისი" },
      contact: "+995 322 55 05 05",
      coords: { lat: 41.7259, lng: 44.7359 },
      image: "https://picsum.photos/seed/evex-clinic/800/600",
    },
    {
      id: "service-pharmacy",
      category: "services",
      subCategory: "pharmacy",
      title: { en: "Aversi Pharmacy", ru: "Аптека Аверси", ge: "აფთიაქი ავერსი" },
      description: { en: "A large 24/7 pharmacy offering a wide selection of medicines, cosmetics, and health products.", ru: "Большая круглосуточная аптека, предлагающая широкий выбор лекарств, косметики и товаров для здоровья.", ge: "დიდი 24/7 აფთიაქი, რომელიც გთავაზობთ მედიკამენტების, კოსმეტიკური და ჯანმრთელობის პროდუქტების ფართო არჩევანს." },
      address: { en: "71 Vazha-Pshavela Ave, Tbilisi", ru: "пр. Важа-Пшавела 71, Тбилиси", ge: "ვაჟა-ფშაველას გამზ. 71, თბილისი" },
      contact: "+995 322 99 99 99",
      coords: { lat: 41.7228, lng: 44.7394 },
      image: "https://picsum.photos/seed/aversi-pharmacy/800/600",
    },
];
let MOCK_QUESTS: Quest[] = [
    { id: '1', authorId: 'user-admin', status: QuestStatus.Published, title: { en: 'Old Town Mysteries', ru: 'Тайны Старого города', ge: 'ძველი ქალაქის საიდუმლოებები' }, description: { en: 'Uncover secrets hidden in the narrow streets of historic Tbilisi.', ru: 'Раскройте секреты, спрятанные на узких улочках исторического Тбилиси.', ge: 'აღმოაჩინეთ ისტორიული თბილისის ვიწრო ქუჩებში დამალული საიდუმლოებები.' }, mainImage: 'https://picsum.photos/seed/oldtown/800/600', difficulty: QuestDifficulty.Easy, duration: 60, category: 'History', price: 9.99, steps: [
        { stepIndex: 0, title: { en: 'The Clock Tower', ru: 'Часовая башня', ge: 'საათის კოშკი' }, clue: { en: 'Find the leaning tower of Tbilisi, where a puppet show marks the hour.', ru: 'Найдите падающую башню Тбилиси, где кукольное представление отмечает час.', ge: 'იპოვეთ თბილისის დახრილი კოშკი, სადაც თოჯინების შოუ საათს აღნიშნავს.' }, image: 'https://picsum.photos/seed/clock/800/600', coords: { lat: 41.6934, lng: 44.8078 }, question: { type: QuestionType.OpenText, question: { en: 'What animal appears at the top of the clock?', ru: 'Какое животное появляется наверху часов?', ge: 'რომელი ცხოველი ჩანს საათის თავზე?' }, answer: { en: 'angel', ru: 'ангел', ge: 'ანგელოზი' }, hint: { en: 'It has wings and appears on the hour.', ru: 'У него есть крылья и он появляется каждый час.', ge: 'მას ფრთები აქვს და საათში ერთხელ ჩნდება.'} }, postAnswerInfo: { en: 'This unique clock tower was created by renowned Georgian puppeteer Rezo Gabriadze. The angel strikes the bell on the hour.', ru: 'Эта уникальная башня с часами была создана известным грузинским кукольником Резо Габриадзе. Ангел бьет в колокол каждый час.', ge: 'ეს უნიკალური საათის კოშკი შეიქმნა ცნობილი ქართველი მეზღაპრის რეზო გაბრიაძის მიერ. ანგელოზი საათში ერთხელ რეკავს ზარს.' } }
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

let MOCK_HOME_PAGE_CONTENT: HomePageContent = {
    id: 'home',
    heroImage: 'https://images.unsplash.com/photo-1562122502-39f1c0d54032?q=80&w=1920&auto=format&fit=crop',
    title: { en: 'TOURSELF', ru: 'TOURSELF', ge: 'TOURSELF' },
    subtitle: { en: 'Quests, Guides, and Local Life.', ru: 'Квесты, гиды и местная жизнь.', ge: 'ქვესტები, გიდები და ადგილობრივი ცხოვრება.' },
    card1Title: { en: 'Explore Local Guide', ru: 'Изучить Гид по городу', ge: 'ადგილობრივი გიდის დათვალიერება' },
    card1Description: { en: 'Discover top sites, restaurants, and services. Completely free.', ru: 'Откройте для себя лучшие места, рестораны и услуги. Совершенно бесплатно.', ge: 'აღმოაჩინეთ საუკეთესო ადგილები, რესტორნები და სერვისები. სრულიად უფასოდ.' },
    card2Title: { en: 'Find City Quests', ru: 'Найти Городские Квесты', ge: 'იპოვეთ ქალაქის ქვესტები' },
    card2Description: { en: 'Unlock exciting, gamified tours to explore the city\'s secrets.', ru: 'Разблокируйте захватывающие игровые туры, чтобы исследовать секреты города.', ge: 'გახსენით საინტერესო, თამაშით სავსე ტურები ქალაქის საიდუმლოებების შესასწავლად.' },
};

let MOCK_PROMO_CODES: PromoCode[] = [
    { id: 'promo-1', code: 'SUMMER2025', questIds: [], usageLimit: 100, currentUsage: 12, expirationDate: '2025-08-31' },
    { id: 'promo-2', code: 'VIPACCESS', questIds: ['1'], usageLimit: 10, currentUsage: 10, expirationDate: '2024-12-31' },
    { id: 'promo-3', code: 'FREEQUEST', questIds: ['2'], usageLimit: 0, currentUsage: 5, expirationDate: '2025-12-31' },
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

  // Home Page Content
  getHomePageContent: async (): Promise<HomePageContent> => {
    await new Promise(res => setTimeout(res, 300));
    return MOCK_HOME_PAGE_CONTENT;
  },
  updateHomePageContent: async (data: HomePageContent): Promise<HomePageContent> => {
    await new Promise(res => setTimeout(res, 500));
    MOCK_HOME_PAGE_CONTENT = data;
    return MOCK_HOME_PAGE_CONTENT;
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
  },
  
  // Payment and Promo Codes
  getPromoCodes: async (): Promise<PromoCode[]> => {
      await new Promise(res => setTimeout(res, 300));
      return MOCK_PROMO_CODES;
  },
  createPromoCode: async (data: Omit<PromoCode, 'id' | 'currentUsage'>): Promise<PromoCode> => {
      await new Promise(res => setTimeout(res, 500));
      const newCode: PromoCode = { ...data, id: `promo-${Date.now()}`, currentUsage: 0 };
      MOCK_PROMO_CODES.push(newCode);
      return newCode;
  },
  updatePromoCode: async (id: string, data: PromoCode): Promise<PromoCode | undefined> => {
      await new Promise(res => setTimeout(res, 500));
      const index = MOCK_PROMO_CODES.findIndex(c => c.id === id);
      if (index !== -1) {
          MOCK_PROMO_CODES[index] = data;
          return data;
      }
      return undefined;
  },
  deletePromoCode: async (id: string): Promise<boolean> => {
      await new Promise(res => setTimeout(res, 500));
      const initialLength = MOCK_PROMO_CODES.length;
      MOCK_PROMO_CODES = MOCK_PROMO_CODES.filter(c => c.id !== id);
      return MOCK_PROMO_CODES.length < initialLength;
  },
  applyPromoCode: async (code: string, questId: string): Promise<{ success: boolean; message: string; }> => {
    await new Promise(res => setTimeout(res, 500));
    const promo = MOCK_PROMO_CODES.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (!promo) return { success: false, message: 'Promo code not found.' };

    const today = new Date();
    const expiry = new Date(promo.expirationDate);
    if (today > expiry) return { success: false, message: 'Promo code has expired.' };

    if (promo.usageLimit > 0 && promo.currentUsage >= promo.usageLimit) {
        return { success: false, message: 'Promo code has reached its usage limit.' };
    }

    if (promo.questIds.length > 0 && !promo.questIds.includes(questId)) {
        return { success: false, message: 'Promo code is not valid for this quest.' };
    }

    promo.currentUsage++;
    return { success: true, message: 'Promo code applied successfully!' };
  },

  processPayPalPayment: async (questId: string, userDetails: any): Promise<{ success: boolean; transactionId?: string; message: string }> => {
    await new Promise(res => setTimeout(res, 2000));
    console.log('Processing PayPal payment for quest:', questId, 'User:', userDetails);
    // Simulate a 95% success rate
    if (Math.random() > 0.05) {
      return { success: true, transactionId: `PAYPAL-${Date.now()}`, message: "Payment successful" };
    } else {
      return { success: false, message: "Payment failed. Please try again." };
    }
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