<?php
session_start();
header('Content-Type:application/json'); 
if(isset($_GET['modo'])){
   

    switch($_GET['modo']){
        case "test":
            $addressFrom= "Belén,Catamarca,Argentina";
            $addressTo= "Aldea San A,Entre Rios,Argentina";
            $unit="k";
            $json=getDistance($addressFrom, $addressTo, $unit);
            break;
   
        default:
            $json = array("error" => "Modo no valido", "errno" => "2");
        break;
    }
}else{
    $json = array("error" => "No se seleciono modo de publicaciones", "errno" => "1");
}
echo json_encode($json);



            function getDistance($addressFrom, $addressTo, $unit){
            //Change address format
            $formattedAddrFrom = str_replace(' ','+',$addressFrom);
            $formattedAddrTo = str_replace(' ','+',$addressTo);

            //Send request and receive json data
            $geocodeFrom = file_get_contents('http://maps.google.com/maps/api/geocode/json?address='.$formattedAddrFrom.'&sensor=false');
            $outputFrom = json_decode($geocodeFrom);
            $geocodeTo = file_get_contents('http://maps.google.com/maps/api/geocode/json?address='.$formattedAddrTo.'&sensor=false');
            $outputTo = json_decode($geocodeTo);

            //Get latitude and longitude from geo data
            $latitudeFrom = $outputFrom->results[0]->geometry->location->lat;
            $longitudeFrom = $outputFrom->results[0]->geometry->location->lng;
            $latitudeTo = $outputTo->results[0]->geometry->location->lat;
            $longitudeTo = $outputTo->results[0]->geometry->location->lng;

            //Calculate distance from latitude and longitude
            $theta = $longitudeFrom - $longitudeTo;
            $dist = sin(deg2rad($latitudeFrom)) * sin(deg2rad($latitudeTo)) + cos(deg2rad($latitudeFrom)) * cos(deg2rad($latitudeTo)) * cos(deg2rad($theta));
            $dist = acos($dist);
            $dist = rad2deg($dist);
            $miles = $dist * 60 * 1.1515;
            $unit = strtoupper($unit);
            if ($unit == "K") {
            return ($miles * 1.609344).' km';
            } else if ($unit == "N") {
            return ($miles * 0.8684).' nm';
            } else {
            return $miles.' mi';
            }
            }
?>