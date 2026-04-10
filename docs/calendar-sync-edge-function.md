# Sincronizzazione calendario Airbnb / Booking.com

L'app permette di collegare per ogni struttura gli URL iCal di Airbnb e Booking.com e di avviare una sincronizzazione che importa le date prenotate nel calendario Nomadiqe.

## Cosa fa l'app

- Nella schermata **La mia struttura** → sezione **Sincronizza con Airbnb e Booking.com**:
  - L’host può incollare l’**URL iCal** di Airbnb e/o di Booking.com (si trovano nelle impostazioni calendario della proprietà su ciascun portale).
  - **Salva link calendari**: salva gli URL sulla struttura.
  - **Sincronizza ora**: chiama l’Edge Function `sync-property-calendar` che scarica gli iCal e aggiorna le date in `property_availability` come `occupied`.

## Database

- Tabella `properties`: colonne aggiunte da `scripts/supabase-property-calendar-sync.sql`:
  - `airbnb_ical_import_url` (TEXT)
  - `booking_ical_import_url` (TEXT)
  - `calendar_sync_last_at` (TIMESTAMPTZ)

## Edge Function da deployare (Supabase)

Per far funzionare **Sincronizza ora** va creata e deployata un’Edge Function Supabase.

1. **Nome**: `sync-property-calendar`

2. **Payload** (POST body):
   - `property_id` (UUID): id della struttura

3. **Logica**:
   - Leggere la riga `properties` per `property_id` e prendere `airbnb_ical_import_url` e `booking_ical_import_url`.
   - Per ogni URL non vuoto:
     - Fare `fetch(url)` (lato server non ci sono problemi CORS).
     - Parsare il testo iCal (formato ICS): estrarre gli eventi (blocchi `BEGIN:VEVENT` … `END:VEVENT`) e le date `DTSTART`/`DTEND`.
     - Per ogni giorno coperto da un evento, fare upsert su `property_availability` con `(property_id, date, status='occupied', price_override=null)`.
   - Aggiornare `properties.calendar_sync_last_at = now()` per la struttura.
   - Restituire `{ ok: true }` o `{ error: "..." }`.

4. **RLS**: la funzione deve usare il client Supabase con la chiave di servizio (service role) per leggere/aggiornare `properties` e `property_availability`, oppure ricevere il JWT dell’utente e usare l’RPC con l’utente autenticato (in quel caso le policy RLS devono permettere all’host della struttura di aggiornare la propria availability).

5. **Parsing iCal (semplice)**:
   - Gli eventi hanno `DTSTART` e `DTEND` (formato tipo `DTSTART:20250115` o `DTSTART;VALUE=DATE:20250115`).
   - Estrarre le date e per ogni giorno nell’intervallo [start, end) inserire una riga in `property_availability` con `status = 'occupied'`.

Dopo il deploy della funzione, il pulsante **Sincronizza ora** nell’app funzionerà senza altre modifiche (l’app chiama già `supabase.functions.invoke('sync-property-calendar', { body: { property_id } })`).

## Dove trovare gli URL iCal

- **Airbnb**: Calendario → Impostazioni calendario → Importa calendario → “Export calendar” / “iCal”. Copia l’URL fornito.
- **Booking.com**: Estremo → Struttura → Calendario / Disponibilità → Sincronizzazione calendario → “Importa un calendario” → URL iCal.

## Link esportazione calendario (già in app)

Nella schermata **La mia struttura** → sezione **Sincronizza con Airbnb e Booking.com**, l’host vede anche:
- **Esporta il tuo calendario su Airbnb e Booking**: testo che spiega di copiare il link e incollarlo nella sezione «Importa calendario» di Airbnb/Booking.
- **URL**: `{EXPO_PUBLIC_CALENDAR_EXPORT_BASE_URL}?property_id={property_id}` (configurare la variabile d’ambiente).
- Pulsante **Copia link esportazione**.

L’endpoint deve rispondere in formato iCal (vedi sotto).

## Esportare il calendario Nomadiqe verso Airbnb/Booking (endpoint)

Per far sì che le date bloccate in Nomadiqe si vedano su Airbnb/Booking, serve un **link di esportazione iCal** che le piattaforme possano periodicamente scaricare. Esempio:

- Endpoint pubblico (es. Edge Function o API): `GET /ical/export?property_id=xxx` (con eventuale token per sicurezza).
- La risposta è `Content-Type: text/calendar` e corpo in formato ICS con un evento per ogni data in `property_availability` dove `status` è `occupied` o `closed` (o solo `occupied`, a scelta).

L’host incolla questo URL in Airbnb/Booking nella sezione “Importa calendario” così le prenotazioni e chiusure gestite in Nomadiqe si riflettono sugli altri portali.
