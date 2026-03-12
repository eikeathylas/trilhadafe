<?php

// Importa as funções de modelo
include "../function/dashboard-functions.php";


function getDashboardStats()
{
   if (!verifyToken()) return;

    $data = [
        "id_user" => getAuthUserId(),
        "org_id" => $_POST["org_id"],
        "year_id" => $_POST["year_id"],
    ];

    echo json_encode(getDashboardStatsData($data));
}


function getUpcomingEvents()
{
    if (!verifyToken()) return;

    $data = [
        "user_id" => getAuthUserId(),
        "org_id" => $_POST["org_id"],
    ];

    echo json_encode(getUpcomingEventsData($data));
}
