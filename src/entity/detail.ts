import {
  Check,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import Supply from './supply';

@Entity({ name: 'P' })
@Check(`"Weight" > 0`)
@Unique(['name', 'city', 'color'])
export default class Detail {
  @PrimaryGeneratedColumn({ name: 'PID', type: 'int' })
  id: number;

  @Column({ name: 'PName', type: 'char', length: 20, nullable: false })
  name: string;

  @Column({ name: 'PCity', type: 'char', length: 20, nullable: false })
  city: string;

  @Column({ name: 'Color', type: 'char', length: 20 })
  color: boolean;

  @Column({ name: 'Weight', type: 'float' })
  weight: number;

  @OneToMany(
    _type => Supply,
    supply => supply.detail,
  )
  supplies: Supply[];
}
