export function formatStringDateToDDMMAAAA(data) {
    let d = data.toString().replace(/\D/g, '');
    return d.substring(6, 8) + '/' + d.substring(4, 6) + '/' + d.substring(0, 4);
}

export function formatDateToAAAAMMDD(date) {
    var day = date.getDate()
    if ((String(day).length < 2)) {
        day = `0${day}`
    }
    var month = (date.getMonth()+1)
    if ((String(month).length < 2)) {
        month = `0${month}`
    }
    var year = date.getFullYear()

    return `${year}-${(month)}-${day}`;
}

export function formatDateToDDMMAAAA(date) {
    var day = date.getDate()
    if ((String(day).length < 2)) {
        day = `0${day}`
    }
    var month = (date.getMonth()+1)
    if ((String(month).length < 2)) {
        month = `0${month}`
    }
    var year = date.getFullYear()

    return `${day}/${(month)}/${year}`;
}

export function getHoraAtual() {
    let date = new Date();
    var hh = date.getHours()
    var mm = date.getMinutes()
    var ss = date.getSeconds()

    return `${hh}:${mm}:${ss}`;
}

export function getDataAtual() {
    var date = new Date();
    var day = date.getDate();
    if ((String(day).length < 2)) {
        day = `0${day}`
    }
    var month = (date.getMonth()+1)
    if ((String(month).length < 2)) {
        month = `0${month}`
    }
    var year = date.getFullYear()

    return `${day}/${(month)}/${year}`;
}