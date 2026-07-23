const statusRaw = null;
const status = ["pending", "filed", "accepted", "rejected"].includes(statusRaw?.toLowerCase() || "") ? statusRaw?.toLowerCase() : "filed";
console.log(status);
