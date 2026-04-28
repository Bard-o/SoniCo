# SoniCo

# Main idea

Ok so the idea here is to create a complete system to manage a music studio (no mastering or production instead rooms and spaces for musical rehearsal). I’ll explain briefly my idea for the service and the component i consider “key” for the system 

The user, could be capable of 3 things 

- Make a reservation for a room
- Add more items to that reservation
- Rent a specific item
- Edit or Delete his reservations

## Reservation

The reservation for the room is simple, he specify what rehearsal room he want, for how many half hours (minimum 1 hour) and the day and time for the beginning of the reservation. Depending of availability the reservation is allowed to be made

Is also importan when the user specify witch rehearsal room does he wants it is showed to him a list of the equipment that is included within the reservation of that room (for example the audio console and sound speakers, guitar amps, microphones, drum set and so on) that list has to be sorted by the category of the item (more of that later on)  

I didn’t mention it earlier but the band name would be cool for an optional attribute of the reservation 

## Adding more items for the reservation

Is normal that in some cases the items within the base reservation are not enough, like one musician couldn’t bring his keyboard and he need one for band practice or someone wants to try a Guitar pedal that the studio has in his inventory, so the user is capable of adding more of those items for his rehearsal room reservation, obviously if that item has his corresponding availability 

## Rental of equipment

Also a very common use of these places is for rent of equipment (especially for gigs), for example when the bar doesn’t have a drum set or ar guitar amp this is very useful, this is obviously a separate panel where the user can view the catalog of equipment available for reservation by category, add them to the “cart” and then make their reservation specifying the start and the end of it and checking availability.

## Edit/Remove reservations

On the user Main page he can view his current reservations, he can select 1 and 

<aside>

❗For the first iteration we will not incorporate at **Payment Gateway**. but the idea is to incorporate **Stripe** and let the studio owner decide if he want to make his reservations with no payment by platform, first half first by the platform, or full in advance using the platform

</aside>

# Studio owner actions

<aside>

❓ I still haven't decided yet if make this platform “unique for a single studio” or “a platform where owners with an authorization key made by an admin can put their studios”

This is some mayor decision so help me with that, i think the best for the MVP is to make a single studio and if i like it escalate 

</aside>

The studio owner can, clearly, own the studio.

## Add, remove, edit Rooms

The Admin can add a room with fotos of this, the description and the list of items that are linked to that room, edit the prices and so.

When he edits the room in addition to editing the fields he can make the room unavailable for a period of time or indefinitely, he can also add o remove the items linked.

He can also delete the room.

## Add, remove, edit Items

Mainly the same but for items, he can add items with descriptions and photos of them.

Add prices (prices for adding it to a room reservation or prices for rent them outside the studio)

He can add the property of an object to specify that it is also being sold at a price, or even that some items are for sale and not for reservation

The admin can also edit the availability field of the item or delete them 

## Edit/delete reservations

I think the studio owner can cancel or remove items of a reservation, obviously that will send an item to the  user in question, in next iterations we've already taken care of how to handle returns by the payment gateway

# Cool features i want this to have

## calendar view for rooms and items

The calendar view for the rooms could be placed in the studio main page first a multiple option selection for select the room and below that you can see the weekly calendar view of the reservation for that room

Also when you are making a reservation you can check the calendar for that room

<aside>

❓ I have the idea to make a calendar view for items, but i currently dont know where to put it and how to handle it so we cand item it for this iteration and only make that when you select an item toa add to a room reservation or to rent below the item it show a list of the nearest reservations of that item

</aside>

# Tech Stack

- **Frontend: React (TypeScript) + Tailwind**.
- **Backend: Django**.
- **Database and more: Supabase**
    - **PostgreSQL**
    - **Auth**
    - **Storage:** for photos and so
- Docker for pack it all together