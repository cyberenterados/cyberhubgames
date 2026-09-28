"use strict";


/* =========================
   ELEMENTOS
========================= */

const timeElement = document.getElementById("time");
const dateElement = document.getElementById("date");
const locationElement = document.getElementById("location");


/* =========================
   ZONA HORARIA
========================= */

const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;


/* =========================
   FORMATEAR HORA
========================= */

function updateClock() {

    const now = new Date();

    const timeFormatter = new Intl.DateTimeFormat(
        navigator.language || "es",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: timeZone
        }
    );

    const dateFormatter = new Intl.DateTimeFormat(
        navigator.language || "es",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: timeZone
        }
    );


    timeElement.textContent =
        timeFormatter.format(now);


    dateElement.textContent =
        dateFormatter.format(now);


    locationElement.textContent =
        timeZone.replaceAll("_", " ");
}


/* =========================
   INICIALIZAR
========================= */

updateClock();


/*
   Ejecutamos aproximadamente
   cada segundo.
*/

setInterval(updateClock, 1000);