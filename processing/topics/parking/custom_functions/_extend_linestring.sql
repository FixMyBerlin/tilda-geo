-- WHAT IT DOES:
-- Extend a linestring by a specified length at start (negative) or end (positive).
-- * Calculates azimuth from endpoint, projects new point, adds to linestring
-- * Positive length extends from end, negative length extends from start
-- USED IN: (currently unused - may be legacy code)
CREATE OR REPLACE FUNCTION extend_linestring (line geometry, length double precision) RETURNS geometry LANGUAGE plpgsql AS $$
DECLARE
    start_point geometry;
    end_point geometry;
    azimuth double precision;
    new_point geometry;
    new_index integer;
BEGIN
    IF length = 0 THEN
        RETURN line;
    END IF;

    IF length > 0 THEN
        start_point := ST_EndPoint(line);
        end_point := ST_PointN(line, -2);
        new_index := -1;
    ELSE
        start_point := ST_StartPoint(line);
        end_point := ST_PointN(line, 2);
        new_index := 1;
    END IF;

    azimuth := ST_Azimuth(start_point, end_point);
    new_point := ST_Project(start_point, abs(length), azimuth);

    RETURN ST_AddPoint(line, new_point, new_index);
END;
$$;
