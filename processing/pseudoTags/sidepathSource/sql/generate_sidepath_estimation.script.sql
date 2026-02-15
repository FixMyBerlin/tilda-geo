\set QUIET on
\set ON_ERROR_STOP on


-- quietly load sidepath_lib
\o /dev/null
\ir sidepath_lib.sql
\o

-- set parameter defaults
\if :{?buffer_size} \else  \set buffer_size 22.0 \endif
\if :{?buffer_distance} \else \set buffer_distance 100.0 \endif

-- if `paths_table` or `roads_table` parameter is set
--   setup views to override the paths and roads table we are reading from
\if :{?paths_table}
CREATE TEMPORARY VIEW _sidepath_estimation_paths as SELECT * FROM :paths_table;
\else
  \set paths_table _sidepath_estimation_paths
\endif
\if :{?roads_table}
CREATE TEMPORARY VIEW _sidepath_estimation_roads as SELECT * FROM :roads_table;
\else
  \set roads_table _sidepath_estimation_roads
\endif

-- reset checkpoint_nr_sequence
SELECT setval('checkpoint_nr_sequence', 1);

-- check format arg
SELECT
  :'format' = 'sidepath_dict' as sidepath_dict,
  :'format' = 'is_sidepath_no' as is_sidepath_no,
  :'format' = 'is_sidepath_yes' as is_sidepath_yes,
  :'format' = 'is_sidepath_csv' as is_sidepath_csv
\gset

\echo :format :sidepath_dict

-- set output to outfile
\if :{?outfile}
  \o :outfile
\else
  \o
\endif



\if :sidepath_dict
\echo `date` 'Start generating sidepath_dict'
\pset format unaligned
\pset tuples_only on
SELECT sidepath_dict_jsonl(:buffer_distance, :buffer_size);

\elif :is_sidepath_yes
\echo `date` 'Start generating is_sidepath_yes'
\pset format csv
\pset tuples_only off
SELECT * FROM sidepath_idlist_yes(:buffer_distance, :buffer_size);

\elif :is_sidepath_no
\echo `date` 'Start generating is_sidepath_no'
\pset format csv
\pset tuples_only off
SELECT * FROM sidepath_idlist_no(:buffer_distance, :buffer_size);

\elif :is_sidepath_csv
\echo `date` 'Start generating sidepath_csv'

\pset format csv
\pset tuples_only off
SELECT * FROM sidepath_csv(:buffer_distance, :buffer_size);

\else

\echo 'ERROR: please set variable "format" to one of: sidepath_dict|is_sidepath_yes|is_sidepath_no|is_sidepath_csv'
\q

\endif

-- Reset output so final echo goes to stdout, not the outfile
\if :{?outfile}
  \o
\endif

\echo `date` 'Done generating' :format 'for' :paths_table 'and' :roads_table
\echo '       output:' :outfile
